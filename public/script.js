// script.js
document.addEventListener("DOMContentLoaded", function() {
  // Load movie data
  fetch('movies.json')
    .then(response => response.json())
    .then(data => {
      window.movieData = data;
      initializeCards();
      setupFilters();
    });
  // Initialize modal functionality
  const modal = document.getElementById("movieModal");
  const closeBtn = document.querySelector(".close");
  
  closeBtn.onclick = function() {
    modal.style.display = "none";
    const iframe = document.getElementById("modalTrailer");
    iframe.src = "";
  }
  
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      const iframe = document.getElementById("modalTrailer");
      iframe.src = "";
    }
  }
});

function initializeCards() {
  // Populate movies
  const moviesGallery = document.querySelector('.gallery');
  window.movieData.movies.forEach(movie => {
    const card = createCard(movie);
    card.onclick = () => showModal(movie);
    moviesGallery.appendChild(card);
  });

  // Populate web series
  const webSeriesGallery = document.querySelector('.gallery1');
  window.movieData.webSeries.forEach(series => {
    const card = createCard(series);
    card.onclick = () => showModal(series);
    webSeriesGallery.appendChild(card);
  });
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.name = item.name;
  card.dataset.year = item.year;
  card.dataset.genre = Array.isArray(item.genre) ? item.genre.join(', ') : item.genre;
  card.dataset.language = "English"; // Add this if you have language data

  card.innerHTML = `
    <img src="${item.poster}" alt="${item.name}">
    <div class="info">
      <h3>${item.name}</h3>
      <p>Released: ${item.year}</p>
    </div>
  `;

  return card;
}

function showModal(item) {
  const modal = document.getElementById("movieModal");
  const modalContent = document.querySelector(".modal-content");
  
  // Set the poster as blended background for content only
  modalContent.style.setProperty('--poster-bg', `url('${item.poster}')`);
  
  // Populate modal
  document.getElementById("modalTitle").textContent = item.name;
  document.getElementById("modalYear").textContent = item.year;
  document.getElementById("modalRating").textContent = item.rating;
  document.getElementById("modalDuration").textContent = item.duration;
  document.getElementById("modalDescription").textContent = item.description;
  document.getElementById("modalDirector").textContent = item.director;
  document.getElementById("modalWriters").textContent = Array.isArray(item.writers) ? item.writers.join(', ') : item.writers;
  document.getElementById("modalStars").textContent = Array.isArray(item.stars) ? item.stars.join(', ') : item.stars;
  document.getElementById("modalPoster").src = item.poster;
  document.getElementById("modalWatchLink").href = item.watch_link;
  document.getElementById("modalTrailerLink").href = item.trailer;
  
  // Set up genres
  const genresContainer = document.getElementById("modalGenres");
  genresContainer.innerHTML = "";
  if (Array.isArray(item.genre)) {
    item.genre.forEach(genre => {
      const span = document.createElement("span");
      span.textContent = genre;
      genresContainer.appendChild(span);
    });
  }
  
  // Set up YouTube video
  const videoUrl = new URL(item.trailer);
  const videoId = videoUrl.searchParams.get("v");
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  document.getElementById("modalTrailer").src = embedUrl;
  
  // Show modal
  modal.style.display = "block";
}

function setupFilters() {
  // Filter functions
  window.toggleMenu = function() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('open');
  }

  window.applyFilters = function() {
    const getVal = (id) => document.getElementById(id)?.value?.toLowerCase() || "";

    const name = getVal('nameFilter') || getVal('nameFilterMobile');
    const year = document.getElementById('yearFilter')?.value || document.getElementById('yearFilterMobile')?.value || "";
    const genre = document.getElementById('genreFilter')?.value || document.getElementById('genreFilterMobile')?.value || "";
    const language = document.getElementById('languageFilter')?.value || document.getElementById('languageFilterMobile')?.value || "";

    let moviesVisible = 0;
    let webSeriesVisible = 0;

    document.querySelectorAll('.card').forEach(card => {
      const cardName = card.dataset.name?.toLowerCase() || "";
      const cardYear = card.dataset.year || "";
      const cardGenre = card.dataset.genre || "";
      const cardLanguage = card.dataset.language || "";

      const matchName = !name || cardName.includes(name);
      const matchYear = !year || cardYear === year;
      const matchGenre = !genre || cardGenre.includes(genre);
      const matchLanguage = !language || cardLanguage === language;

      const isMatch = matchName && matchYear && matchGenre && matchLanguage;
      card.style.display = isMatch ? 'block' : 'none';

      if (isMatch) {
        if (card.closest('.gallery')) moviesVisible++;
        if (card.closest('.gallery1')) webSeriesVisible++;
      }
    });

    document.getElementById('noMoviesMessage')?.style.setProperty('display', moviesVisible ? 'none' : 'block');
    document.getElementById('noWebSeriesMessage')?.style.setProperty('display', webSeriesVisible ? 'none' : 'block');
  }

  window.sortByYear = function() {
    document.querySelectorAll('.gallery, .gallery1').forEach(gallery => {
      const cards = Array.from(gallery.querySelectorAll('.card'));
      cards.sort((a, b) => {
        const yearA = parseInt(a.dataset.year || 0);
        const yearB = parseInt(b.dataset.year || 0);
        return yearB - yearA;
      });
      cards.forEach(card => gallery.appendChild(card));
    });
  }

  window.clearFilters = function() {
    ['nameFilter', 'yearFilter', 'genreFilter', 'languageFilter',
     'nameFilterMobile', 'yearFilterMobile', 'genreFilterMobile', 'languageFilterMobile']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    applyFilters();
  }

  // Initialize filter event listeners
  const filterIds = [
    'nameFilter', 'yearFilter', 'genreFilter', 'languageFilter',
    'nameFilterMobile', 'yearFilterMobile', 'genreFilterMobile', 'languageFilterMobile'
  ];
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });

  applyFilters();
}

