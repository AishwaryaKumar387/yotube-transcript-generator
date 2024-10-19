const axios = require('axios');
const { validationResult } = require("express-validator");

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

    // Prepare the request configuration
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://notegpt.io/api/v2/video-transcript?platform=youtube&video_id=${videoId}`,
      headers: {}
    };

    // Fetch the transcript
    const response = await axios.request(config);

    if(response.data.message && response.data.message=="success")
    {
      let response_data = response.data;
      response.data.data.html = transcripted_html(response_data);
    }

    // Send the response data back to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    // Send error response to the client
    res.status(500).json({ message: "Failed to fetch video transcript", error: error.message });
  }
};


function transcripted_html(response_data)
{
  let data = response_data.data;

  let html = '<div class="px-4 sm:px-10 mt-16 mb-4 ytg-transcripted-data">';
    html+='<div class="mt-16 max-w-7xl mx-auto">';
      html+='<div class="mb-16 max-w-2xl text-center mx-auto">';
        html+='<h2 class="md:text-4xl text-3xl font-semibold md:!leading-[50px] mb-6">Captured Summary:</h2>';
      html+='</div>';

      html+='<div class="yt-tr-section flex flex-wrap gap-[30px]">';
        // Left Section 
        html+='<div class="transcripted-video-info left-section flex-auto lg:w-64">';
          // frame data
          html+='<div class="yt-video-frames-container border border-gray-600 h-auto bg-slate-700 rounded-xl">';
            html+='<div class="yt-video-section-intro text-center py-5 bg-slate-600 rounded-xl">';
              html+='<span class="yt-video-intro-text">Youtube Video</span>';
            html+='</div>';
            html+='<div class="yt-video-frame-data p-5">';
              html+='<iframe width="420" height="315" src="'+data.videoInfo.embedUrl+'"></iframe>'
            html+='</div>';
            html+='<div class="yt-video-name-data-wrapper p-5 pt-0 flex flex-col gap-[10px]">';
            html+='<div class="yt-video-name-data">';
              html+='<span class="yt-video-name-intro font-bold">Video Name: </span>';
              html+='<span class="yt-video-name-text">'+data.videoInfo.name+'</span>';
            html+='</div>';
            html+='<div class="yt-video-author-data">';
              html+='<span class="yt-author-name-intro font-bold">Author Name: </span>';
              html+='<span class="yt-author-name-text">'+data.videoInfo.author+'</span>';
            html+='</div>';
            html+='<div class="yt-video-duration-data">';
              html+='<span class="yt-duration-name-intro font-bold">Video Duration: </span>';
              html+='<span class="yt-duration-name-text">'+convertSecondsToTime(data.videoInfo.duration)+'</span>';
            html+='</div>';
            html+='</div>';
          html+='</div>';
        html+='</div>';
        // End Left Section
        // Right Section
        html+='<div class="transcripted-video-info right-section border border-gray-600 h-auto bg-slate-700 rounded-xl p-5 flex-auto lg:w-64">';
          // copy download section
          html += '<div class="cd-section pb-4">';
            html += '<div class="cd-section-data flex justify-end space-x-4">';
              html += '<img class="cd-copy-icon" src="/images/copy-icon.svg" onclick="copyYTContentSection()">';
              html += '<button id="copyBtn" class="btn copy-btn" onclick="copyYTContentSection()">Copy</button>';
              html +='<img class="cd-download-icon" src="/images/download-icon.svg" onclick="CreatePDFfromHTML()">';
              html += '<button id="downloadBtn" class="btn download-btn" onclick="CreatePDFfromHTML()">Download</button>';
            html += '</div>';
          html += '</div>';
          // content section 
          html+='<div id="yt-content-section-data">';
            html += '<div class="yt-content-section">';
              // Assuming data.transcripts.pa_auto_auto.custom is an array
              if (data.transcripts && Object.keys(data.transcripts).length > 0) {
                // Get the first key in the transcripts object
                const firstKey = Object.keys(data.transcripts)[0];
              
                // Check if the first key has a 'custom' field
                if (data.transcripts[firstKey] && data.transcripts[firstKey].custom) {
                  data.transcripts[firstKey].custom.forEach(function(item) {
                    html += '<div class="content-column pb-4">';
                      html += '<div class="yt-content-start-time pb-2">';
                        html += '<span class="yt-st-text">' + item.start + '</span>'; // Assuming item has a start property
                      html += '</div>';
                      html += '<div class="yt-content-text">';
                        html += '<p class="yt-cont-txt">' + item.text + '</p>'; // Assuming item has a text property
                      html += '</div>';
                    html += '</div>'; // Closing content-column div
                  });
                } else {
                  html += '<div class="no-transcript">No transcript data available.</div>';
                }
              } else {
                html += '<div class="no-transcript">No transcript data available.</div>';
              }

            html += '</div>';
          html += '</div>';
        html+='</div>';
        // End Right Section
      html+='</div>';  

    html+='</div>';  
  html+='</div>';

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

  let r_combinedValue = (parseInt(hour)+3) * 100 + parseInt(minute) + 23; 
  // Emit regular_visitor to all connected clients via Socket.IO
  if (io) {
    io.emit('visitor_data', { today_visitors: r_combinedValue });
  }

  // Optionally, return a JSON response for HTTP requests
  if (res) {
    res.status(200).json({ success: true, regular_visitor: combinedValue });
  }
};
