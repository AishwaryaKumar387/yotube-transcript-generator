let socket = io();
var doc = new jsPDF(); 
var specialElementHandlers = { 
  '#editor': function (element, renderer) { 
      return true; 
  } 
};
// Function to start the loader with fade-in effect
function startLoader() {
  const loader = document.getElementById('page-loader');
  loader.classList.remove('hidden');
  
  // Start with opacity 0 for the fade-in effect
  loader.style.opacity = '0';
  
  // Trigger fade-in
  setTimeout(() => {
    loader.style.transition = 'opacity 0.5s ease'; // Apply the transition
    loader.style.opacity = '1'; // Fade in
  }, 10); // Small timeout to ensure the transition works after removing 'hidden'
}

// Function to stop the loader with fade-out effect
function stopLoader() {
  const loader = document.getElementById('page-loader');
  
  // Fade-out effect
  loader.style.transition = 'opacity 0.5s ease';
  loader.style.opacity = '0';

  // After the fade-out, hide the loader
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 500); // Time for fade-out animation
}

// Example usage: stop loader after page load
window.addEventListener('load', function() {
  stopLoader();
});

var toggleOpen = document.getElementById("toggleOpen");
var toggleClose = document.getElementById("toggleClose");
var collapseMenu = document.getElementById("collapseMenu");

function handleClick() {
  if (collapseMenu.style.display === "block") {
    collapseMenu.style.display = "none";
  } else {
    collapseMenu.style.display = "block";
  }
}

toggleOpen.addEventListener("click", handleClick);
toggleClose.addEventListener("click", handleClick);

// Stopwatch Functionality
function updateStopwatch() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Determine AM or PM
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, "0") : "12"; // Adjust for 12 AM/PM

  document.getElementById(
    "stopwatch"
  ).innerText = `${hours}:${minutes}:${seconds} ${ampm}`;
}

// Update every second
setInterval(updateStopwatch, 1000);
updateStopwatch(); // Initial call to display time immediately

document.querySelector(".transcript-yt-video-link").addEventListener("submit", async function (e) {
  e.preventDefault(); // Prevent the default form submission

  // Scope the query to only inside the form
  const form = this; // 'this' refers to the form element (.transcript-yt-video-link)
  const submitButton = form.querySelector('button[type="submit"]');
  
  const existingData = document.querySelector('.ytg-transcripted-data');
  if (existingData){
    existingData.remove()
  };
  
  // Get the input field value (YouTube video link) within the form
  const youtubeUrl = form.querySelector("#default-search").value;

  if (!youtubeUrl) {
    swal("", "Please enter a valid YouTube URL.", "error");
    return;
  }

  // Disable the submit button and set the text to "Wait..."
  submitButton.disabled = true;
  submitButton.textContent = "Wait...";
  startLoader();
  try {
    // Send POST request to the backend to fetch the video transcript using fetch
    const response = await fetch('/transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: youtubeUrl,
      }),
    });

    // Check if the request was successful
    if (!response.ok) {
      throw new Error("Failed to fetch transcript");
    }

    const data = await response.json();

    if (data.message === "success") {
      let videoInfo = data.data.videoInfo;
      let html = data.data.html;

      // Insert the HTML content before the .yt-own-features div
      const targetElement = document.querySelector('.yt-own-features');
      if (targetElement) {
        targetElement.insertAdjacentHTML('beforebegin', html); // Inserts the html before .yt-own-features div
      }

      const transcriptedDataElement = document.querySelector('.ytg-transcripted-data');

      // Check if the element exists
      if (transcriptedDataElement) {
        // Scroll to the element
        transcriptedDataElement.scrollIntoView({
            behavior: 'smooth', // Smooth scrolling
            block: 'start' // Align to the start of the viewport
        });
      } else {
        console.log("Element not found.");
      }
    }
    else{
      swal("Oops !!", "Looks like transcription not allowed on video by author","error");
    }

  } catch (error) {
    console.error("Error fetching transcript:", error);
    alert("Error fetching transcript. Please try again.");

  } finally {
    // Re-enable the submit button and set the text back to "Submit"
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
    stopLoader();
  }
});

function copyYTContentSection() {
  // Find the element with the class .yt-content-section
  const contentSection = document.querySelector('.yt-content-section');
  
  // Check if the element exists
  if (contentSection) {
    // Create a temporary textarea element
    const tempTextArea = document.createElement('textarea');
    
    // Set the textarea's content to the inner text of the .yt-content-section
    tempTextArea.value = contentSection.innerText;
    
    // Append the textarea to the document body
    document.body.appendChild(tempTextArea);
    
    // Select the content of the textarea
    tempTextArea.select();
    
    // Copy the selected content to the clipboard
    document.execCommand('copy');
    
    // Remove the temporary textarea
    document.body.removeChild(tempTextArea);
    
    swal("Text copied");
  } else {
      console.log('No element found with class .yt-content-section');
  }
}

function CreatePDFfromHTML()
{
  startLoader();
  const content = document.getElementById('yt-content-section-data').innerHTML;

  // Use fromHTML method to convert HTML to PDF
  doc.fromHTML(content, 15, 15, {
    'width': 190, // Set width for the content
    'elementHandlers': specialElementHandlers
  });

  // Save the generated PDF
  doc.save('transcripted-text.pdf');
  stopLoader();
}

// Listen for incoming regular_visitor_data event
socket.on('visitor_data', (data) => {
  // Update the #regularVisitors element with the received result
  document.getElementById('todayVisitors').textContent = data.today_visitors+'+';
});
