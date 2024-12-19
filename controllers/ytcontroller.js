const axios = require('axios');
const { validationResult } = require("express-validator");
const { getTranscript } = require('youtube-transcript-api');

exports.fetchVideoTranscript = async (req, res) => {
  try {
      // Check for validation errors from the route
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      // Get the YouTube URL from the request body
      const { url } = req.body;

      // Extract the video ID from the YouTube URL
      const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (!videoIdMatch || !videoIdMatch[1]) {
          return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      const videoId = videoIdMatch[1];
      const transcript = await getTranscript(videoId); // Provide only the video ID

      // Calculate total duration
      const totalDuration = calculate_total_yt_duration(transcript);

      // Generate the HTML content
      const transcriptHtml = transcripted_html(transcript, videoId, totalDuration);

      res.status(200).json({
          success: true,
          message:"success",
          transcript: transcript,
          transcriptHtml: transcriptHtml,
      });
  }
  catch (error) {
      console.error(error);
      // Send error response to the client
      res.status(500).json({ message: "Failed to fetch video transcript", error: error.message });
  }
};

function calculate_total_yt_duration(transcript) {
  if (transcript.length === 0) return "00:00"; // Handle empty transcript

  // Get the last entry in the transcript
  const lastEntry = transcript[transcript.length - 1];

  // Add the `start` and `duration`, then round the result
  const totalSeconds = Math.round(lastEntry.start + lastEntry.duration);

  // Convert the total seconds to time format
  return convertSecondsToTime(totalSeconds);
}

function transcripted_html(response_data, video_id, total_duration) {
  let data = response_data;

  let html = '<div class="px-4 sm:px-10 mt-16 mb-4 ytg-transcripted-data">';
      html += '<div class="mt-16 max-w-7xl mx-auto">';

        html += '<div class="mb-16 max-w-2xl text-center mx-auto">';
          html += '<h2 class="md:text-4xl text-3xl font-semibold md:!leading-[50px] mb-6">Captured Summary:</h2>';
        html += '</div>';

        html += '<div class="yt-tr-section flex flex-wrap gap-[30px]">';

          // Left Section 
          html += '<div class="transcripted-video-info left-section flex-auto lg:w-64">';
            html += '<div class="yt-video-frames-container border border-gray-600 h-auto bg-slate-700 rounded-xl">';

              html += '<div class="yt-video-section-intro text-center py-5 bg-slate-600 rounded-xl">';
                html += '<span class="yt-video-intro-text">Youtube Video</span>';
              html += '</div>';

              html += '<div class="yt-video-frame-data p-5">';
                html += '<iframe width="420" height="315" src="https://www.youtube.com/embed/' + video_id + '"></iframe>';
              html += '</div>';

              html += '<div class="yt-video-name-data-wrapper p-5 pt-0 flex flex-col gap-[10px]">';
                html += '<div class="yt-video-duration-data">';
                  html += '<span class="yt-duration-name-intro font-bold">Video Duration: </span>';
                  html += '<span class="yt-duration-name-text">' + total_duration + '</span>';
                html += '</div>';
              html += '</div>';

            html += '</div>';
          html += '</div>';
          // End Left Section

          // Right Section
          html += '<div class="transcripted-video-info right-section border border-gray-600 h-auto bg-slate-700 rounded-xl p-5 flex-auto lg:w-64">';
              html += '<div class="cd-section pb-4">';
                html += '<div class="cd-section-data flex justify-end space-x-4">';
                html += '<img class="cd-copy-icon" src="/images/copy-icon.svg" onclick="copyYTContentSection()">';
                html += '<button id="copyBtn" class="btn copy-btn" onclick="copyYTContentSection()">Copy</button>';
                html += '<img class="cd-download-icon" src="/images/download-icon.svg" onclick="CreatePDFfromHTML()">';
                html += '<button id="downloadBtn" class="btn download-btn" onclick="CreatePDFfromHTML()">Download</button>';
              html += '</div>';
            html += '</div>';

            // content section
            html += '<div id="yt-content-section-data">';
              html += '<div class="yt-content-section">';
                // Check if transcript data is available
                if (data && data.length > 0) {
                    data.forEach(function (item) {
                      html += '<div class="content-column pb-4 bg-gray-300 mb-4 rounded-lg px-6 mr-4 flex">'; 
                        html += '<div class="yt-content-start-time pb-2 mt-2 text-blue-500 px-1">'; 
                          html += '<span class="yt-st-text">' + convertFormatedSecondsToTime(item.start) + '</span>';
                        html += '</div>';
                        html += '<div class="yt-content-text mt-2 text-black dark:text-gray-200 px-2">'; 
                          html += '<p class="yt-cont-txt">' + item.text + '</p>';
                        html += '</div>';
                      html += '</div>';
                    });
                } else {
                  html += '<div class="no-transcript">No transcript data available.</div>';
                }
              html += '</div>';
            html += '</div>';
          html += '</div>';
          // End Right Section

        html += '</div>';

      html += '</div>';
    html += '</div>';

  return html;
}

function convertSecondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600); // Get the number of full hours
  const minutes = Math.floor((seconds % 3600) / 60); // Get the remaining full minutes
  const remainingSeconds = seconds % 60; // Get the remaining seconds

  // Build the time string
  let timeString = '';
  
  if (hours > 0) {
    timeString += `${hours} hrs `;
  }
  if (minutes > 0 || hours > 0) { // Display minutes even if hours is greater than 0
    timeString += `${minutes} mins `;
  }
  timeString += `${remainingSeconds} secs`;

  return timeString;
}

function convertFormatedSecondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600); // Get the full hours
  const minutes = Math.floor((seconds % 3600) / 60); // Get the full minutes
  const remainingSeconds = seconds % 60; // Get the remaining seconds

  // Round the remaining seconds to 2 decimal places
  const roundedSeconds = remainingSeconds.toFixed(2);

  // Format the hours, minutes, and seconds to be two digits where necessary
  const formattedHours = hours > 0 ? `${hours}:` : '';
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds = roundedSeconds < 10 ? `0${roundedSeconds}` : `${roundedSeconds}`;

  // Return the formatted time in "HH:MM:SS" or "MM:SS" if hours is zero
  return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
}


// Regular visitor function
exports.visitorData = async (req, res, io) => {
    // Get the current date
    let now = new Date();

    let year = now.getFullYear();
    let start = new Date(now.getFullYear(), 0, 0);
    let diff = now - start;
    let oneDay = 1000 * 60 * 60 * 24;
    let dayOfYear = Math.floor(diff / oneDay);

    // Get the hour and minute
    let hour = String(now.getHours()).padStart(2, '0'); // Format as 2 digits
    let minute = String(now.getMinutes()).padStart(2, '0'); // Format as 2 digits

    let r_combinedValue = (parseInt(hour) + 3) * 100 + parseInt(minute) + 23;
    // Emit regular_visitor to all connected clients via Socket.IO
    if (io) {
        io.emit('visitor_data', { today_visitors: r_combinedValue });
    }

    // Optionally, return a JSON response for HTTP requests
    if (res) {
        res.status(200).json({ success: true, regular_visitor: combinedValue });
    }
};