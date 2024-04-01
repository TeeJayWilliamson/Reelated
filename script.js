// Function to fetch movie suggestions based on user input
function fetchMovieSuggestions(input, inputElement) {
    // Fetch movie suggestions from API based on user input
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=a4ab15c556f700d554df22a5f7dd7722&query=${encodeURIComponent(input)}`)
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        // Extract movie titles and release years from API response
        var suggestions = data.results.map(function(movie) {
            return { title: movie.title, releaseYear: movie.release_date.split('-')[0] };
        });

        // Update autocomplete suggestions for the input element
        updateAutocomplete(suggestions, inputElement);
    })
    .catch(function(error) {
        console.log('Error fetching movie suggestions:', error);
    });
}

// Function to update autocomplete suggestions for input element
function updateAutocomplete(suggestions, inputElement) {
// Clear previous autocomplete suggestions
clearAutocomplete();

// Ensure the input field's parent has a relative position
// Note: This line might be unnecessary if we're calculating positions absolutely in relation to the viewport
// inputElement.parentNode.style.position = 'relative';

// Get the bounding rectangle of the input element
const rect = inputElement.getBoundingClientRect();

// Create a dropdown menu for suggestions
var dropdown = document.createElement('div');
dropdown.setAttribute('class', 'autocomplete-items');

// Append dropdown to the body to ensure it's positioned absolutely
document.body.appendChild(dropdown);

// Set the dropdown's position based on the input element
dropdown.style.position = 'absolute';
dropdown.style.left = `${rect.left}px`;
dropdown.style.top = `${rect.bottom}px`; // Position it below the input
dropdown.style.width = `${rect.width}px`; // Match the width of the input

// Create suggestion items and add event listeners
suggestions.forEach(function(suggestion) {
var item = document.createElement('div');
item.innerHTML = `<strong>${suggestion.title}</strong> (${suggestion.releaseYear})`;
item.addEventListener('click', function() {
    inputElement.value = suggestion.title;
    clearAutocomplete();
});
dropdown.appendChild(item);
});
}



// Function to clear autocomplete suggestions
function clearAutocomplete() {
    var dropdowns = document.getElementsByClassName('autocomplete-items');
    for (var i = 0; i < dropdowns.length; i++) {
        dropdowns[i].parentNode.removeChild(dropdowns[i]);
    }
}

// Event listener for movie input fields to fetch autocomplete suggestions
document.getElementById('movie1').addEventListener('input', function() {
    var input = this.value.trim();
    if (input) {
        fetchMovieSuggestions(input, this);
    } else {
        clearAutocomplete();
    }
});

document.getElementById('movie2').addEventListener('input', function() {
    var input = this.value.trim();
    if (input) {
        fetchMovieSuggestions(input, this);
    } else {
        clearAutocomplete();
    }
});

// Add the rest of your existing code below...

// Function to handle comparison of movies
document.getElementById('compareButton').addEventListener('click', function() {
    var movie1Title = document.getElementById('movie1').value.trim();
    var movie2Title = document.getElementById('movie2').value.trim();

    if (movie1Title === '' || movie2Title === '') {
        displayErrorMessage('Please enter titles for both movies.');
        return;
    }

    fetchMovieData(movie1Title, movie2Title);
});

// Function to reset input fields and result container
document.getElementById('resetButton').addEventListener('click', function() {
    document.getElementById('movie1').value = '';
    document.getElementById('movie2').value = '';
    document.getElementById('resultContainer').innerHTML = '';
});

// Function to fetch movie data from API
function fetchMovieData(movie1Title, movie2Title) {
    // Fetch movie data for both movies
    Promise.all([
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=a4ab15c556f700d554df22a5f7dd7722&query=${encodeURIComponent(movie1Title)}`),
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=a4ab15c556f700d554df22a5f7dd7722&query=${encodeURIComponent(movie2Title)}`)
    ])
    .then(function(responses) {
        return Promise.all(responses.map(function(response) {
            return response.json();
        }));
    })
    .then(function(data) {
        var movie1Id = data[0].results[0].id;
        var movie2Id = data[1].results[0].id;
        fetchMovieDetails(movie1Id, movie2Id);
    })
    .catch(function(error) {
        console.log('Error fetching movie data:', error);
        displayErrorMessage("An error occurred while fetching movie data. Please try again later.");
    });
}

// Function to fetch movie details from API
function fetchMovieDetails(movie1Id, movie2Id) {
    // Fetch movie details for both movies
    Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${movie1Id}?api_key=a4ab15c556f700d554df22a5f7dd7722&append_to_response=credits`),
        fetch(`https://api.themoviedb.org/3/movie/${movie2Id}?api_key=a4ab15c556f700d554df22a5f7dd7722&append_to_response=credits`)
    ])
    .then(function(responses) {
        return Promise.all(responses.map(function(response) {
            return response.json();
        }));
    })
    .then(function(data) {
        displayComparison(data);
    })
    .catch(function(error) {
        console.log('Error fetching movie details:', error);
        displayErrorMessage("An error occurred while fetching movie details. Please try again later.");
    });
}

// Function to display comparison results
function displayComparison(data) {
    var resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '';

    var movie1 = data[0];
    var movie2 = data[1];

    var similarities = {
        writers: findSimilarItems(movie1.credits.crew, movie2.credits.crew, 'job', 'Screenplay'),
        directors: findSimilarItems(movie1.credits.crew, movie2.credits.crew, 'job', 'Director'),
        producers: findSimilarItems(movie1.credits.crew, movie2.credits.crew, 'job', 'Producer'),
        actors: findSimilarActors(movie1.credits.cast, movie2.credits.cast)
    };

    var foundSimilarity = false;

    for (var category in similarities) {
        var similarity = similarities[category];

        if (similarity.length > 0) {
            foundSimilarity = true;

            var categoryElement = document.createElement('div');
            categoryElement.innerHTML = `<h2>${category}</h2>`;

            var listElement = document.createElement('ul');
            similarity.forEach(function(item) {
                var listItem = document.createElement('li');
                listItem.textContent = item;
                listElement.appendChild(listItem);
            });

            categoryElement.appendChild(listElement);
            resultContainer.appendChild(categoryElement);
        }
    }

    if (!foundSimilarity) {
        displayErrorMessage("These movies don't share any similarities.");
    }
}

// Function to find similar items between two lists
function findSimilarItems(list1, list2, property, value) {
    if (!list1 || !list2) {
        return [];
    }

    var items1 = list1.filter(function(item) {
        return item[property] === value;
    }).map(function(item) {
        return item.name;
    });

    var items2 = list2.filter(function(item) {
        return item[property] === value;
    }).map(function(item) {
        return item.name;
    });

    var similarItems = items1.filter(function(item) {
        return items2.includes(item);
    });

    return similarItems;
}

// Function to find similar actors between two lists
function findSimilarActors(list1, list2) {
    var actors1 = list1.map(function(actor) {
        return actor.name;
    });

    var actors2 = list2.map(function(actor) {
        return actor.name;
    });

    var similarActors = actors1.filter(function(actor) {
        return actors2.includes(actor);
    });

    return similarActors;
}

// Function to display error message
function displayErrorMessage(message) {
    var resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `<p class="error-message">${message}</p>`;
}