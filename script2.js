import {
    auth,
    onAuthStateChanged,
} from './auth/firebase-config.js';

let currentUser = null;
const authStatusDiv = document.getElementById('auth-status');

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        try {
            await user.reload();
            updateAuthControls(true);
            checkPendingPurchases();
            showPurchasedCourses(); // ← ✅ Show access buttons
        } catch (error) {
            console.error("Error reloading user:", error);
            updateAuthControls(true);
        }
    } else {
        updateAuthControls(false);
    }
});

function updateAuthControls(isLoggedIn) {
    if (isLoggedIn) {
        authStatusDiv.innerHTML = `
            <div class="user-icon" id="avatar-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
        `;
        document.getElementById('avatar-icon').addEventListener('click', () => {
            showErrorToast("Welcome! You are logged in.", 'success');
        });
    } else {
        authStatusDiv.innerHTML = `<button id="login-signup-button">Login / Sign Up</button>`;
        document.getElementById('login-signup-button').addEventListener('click', redirectToLogin);
    }
}

async function handleMaterialClick(title, price, productId) {
    try {
        if (!currentUser) {
            showErrorToast("Please log in to purchase this material.");
            savePendingPurchase(title, price, productId);
            redirectToLogin();
            return;
        }

        if (!currentUser.emailVerified) {
            showErrorToast("Please verify your email to complete the purchase.");
            savePendingPurchase(title, price, productId);
            return;
        }

        // If already purchased, open it
        const saved = localStorage.getItem(`purchased-${title}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            window.open(parsed.link, "_blank");
            return;
        }

        await openPayment(title, price, productId, currentUser);
    } catch (error) {
        console.error("Error in handleMaterialClick:", error);
        showErrorToast("Failed to process your request.");
    }
}

async function openPayment(title, amount, productId, user) {
    if (typeof Razorpay === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    return new Promise((resolve, reject) => {
        const options = {
            key: "rzp_test_jQssrrKMG8JAdG",
            amount: Math.round(amount * 100),
            currency: "INR",
            name: "Study Store",
            description: `Purchase: ${title}`,
            handler: async function (response) {
                try {
                    const backendResponse = await fetch('/api/process-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentId: response.razorpay_payment_id,
                            productTitle: title,
                            userEmail: user.email
                        })
                    });

                    const data = await backendResponse.json();
                    if (backendResponse.ok && data.success && data.downloadLink) {
                        showErrorToast("Payment successful! Opening material...", 'success');

                        // ✅ Save to localStorage for persistent access
                        localStorage.setItem(`purchased-${title}`, JSON.stringify({
                            email: user.email,
                            link: data.downloadLink,
                            timestamp: Date.now()
                        }));

                        // ✅ Update the course card immediately
                        const card = document.querySelector(`.study-material-card[data-title="${title}"]`);
                        const button = card.querySelector(".buy-button");
                        button.textContent = "Access Course";
                        button.classList.add("access-button");
                        button.removeEventListener("click", handleBuyClick);
                        button.addEventListener("click", () => {
                            window.open(data.downloadLink, "_blank");
                        });

                        // ✅ Open the link
                        setTimeout(() => {
                            const win = window.open(data.downloadLink, "_blank");
                            if (!win) showErrorToast("Popup blocked!", 'warning');
                        }, 1000);
                        clearPurchaseData();
                        resolve();
                    } else {
                        showErrorToast(data.message || "Server failed to grant access.", 'error');
                        reject();
                    }
                } catch (err) {
                    console.error("Error contacting backend:", err);
                    showErrorToast("Server error while granting access.", 'error');
                    reject();
                }
            },
            prefill: {
                email: user.email,
                name: user.displayName || "",
                contact: user.phoneNumber || ""
            },
            theme: { color: "#007bff" },
            modal: {
                ondismiss: () => reject(new Error("Payment cancelled."))
            },
            retry: { enabled: true, max_count: 2 }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response) => {
            showErrorToast("Payment failed: " + response.error.description, 'error');
            reject();
        });

        rzp.open();
    });
}

// ✅ Show already purchased courses on load
function showPurchasedCourses() {
    if (!currentUser) return;

    document.querySelectorAll(".study-material-card").forEach(card => {
        const title = card.dataset.title;
        const purchaseData = localStorage.getItem(`purchased-${title}`);
        if (purchaseData) {
            const { email, link } = JSON.parse(purchaseData);
            if (email === currentUser.email && link) {
                const button = card.querySelector(".buy-button");
                button.textContent = "Access Course";
                button.classList.add("access-button");
                button.removeEventListener("click", handleBuyClick);
                button.addEventListener("click", () => {
                    window.open(link, "_blank");
                });
            }
        }
    });
}

function checkPendingPurchases() {
    if (!currentUser || !currentUser.emailVerified) return;

    const data = sessionStorage.getItem("pendingPurchase");
    if (data) {
        const pending = JSON.parse(data);
        if ((Date.now() - pending.timestamp) <= 3600000) {
            openPayment(pending.title, pending.price, pending.productId, currentUser)
                .then(() => {
                    showErrorToast("Purchase complete!", 'success');
                    clearPurchaseData();
                })
                .catch(() => {
                    showErrorToast("Purchase failed. Try again.", 'error');
                    clearPurchaseData();
                });
        } else {
            showErrorToast("Pending purchase expired.", 'warning');
            clearPurchaseData();
        }
    }
}

function savePendingPurchase(title, price, productId) {
    const purchase = { title, price, productId, timestamp: Date.now() };
    sessionStorage.setItem("pendingPurchase", JSON.stringify(purchase));
    localStorage.setItem("returnAfterLogin", window.location.pathname + window.location.search);
}

function redirectToLogin() {
    const returnPath = window.location.pathname + window.location.search;
    const encrypted = btoa(encodeURIComponent(returnPath));
    window.location.href = `auth/login.html?return=${encrypted}`;
}

function clearPurchaseData() {
    sessionStorage.removeItem("pendingPurchase");
    localStorage.removeItem("pendingPurchase");
    localStorage.removeItem("returnAfterLogin");
}

function showErrorToast(message, type = 'error') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000);
}

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    document.body.appendChild(div);
    return div;
}

// 👇 Assign click handler to all buy buttons
function handleBuyClick(event) {
    event.preventDefault();
    const card = event.target.closest(".study-material-card");
    const title = card.dataset.title;
    const price = parseFloat(card.dataset.price);
    const productId = card.dataset.productId;
    if (!title || isNaN(price) || !productId) {
        showErrorToast("Missing material details.");
        return;
    }
    handleMaterialClick(title, price, productId);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".study-material-card .buy-button").forEach(button => {
        button.addEventListener("click", handleBuyClick);
    });
});
