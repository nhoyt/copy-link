/*
*   options.js
*/
const defaultFormat = 'markdown';
const defaultTimeout = '3000';
let message;

#ifdef FIREFOX
// Generic error handler for API methods that return Promise
function onError (error) {
  console.log(`Error: ${error}`);
}
#endif

// Request platform info from background script via extension messaging

#ifdef FIREFOX
function onGotBackgroundPage (page) {
  page.getPlatform();
}
browser.runtime.getBackgroundPage().then(onGotBackgroundPage, onError);
#endif
#ifdef CHROME
chrome.runtime.getBackgroundPage(function (page) {
  page.getPlatform();
});
#endif

// Set the message text to be displayed when options are saved. This function
// is called when the platform message is received from the background script.

function setMessage (platform) {
  switch (platform) {
    case 'mac':
      message = 'Preferences saved!';
      break;
    default:
      message = 'Options saved!';
      break;
  }
}

// Add event listener for background script message
#ifdef FIREFOX
browser.runtime.onMessage.addListener(function (request, sender) {
  setMessage(request);
});
#endif
#ifdef CHROME
chrome.runtime.onMessage.addListener(function (request, sender) {
  setMessage(request);
});
#endif

/* -------------------------------------------------------- */
/*   Functions for saving and restoring user options        */
/* -------------------------------------------------------- */

// Save user options in browser.storage and display message

function saveOptions(e) {
  e.preventDefault();

  // For use during development
  if (false) {
#ifdef FIREFOX
    browser.storage.sync.clear();
#endif
#ifdef CHROME
    chrome.storage.sync.clear();
#endif
    return;
  }

  let formats = document.getElementById('formats');
  let inputs = formats.getElementsByTagName('input');
  let selectedFormat = null;

  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].checked) {
      selectedFormat = inputs[i].value;
      break;
    }
  }

  function notifyUser () {
    let status = document.getElementById('status');
    status.textContent = message;

    setTimeout(function () {
      status.textContent = '';
    }, 750);
    console.log(message);
  }

  if (selectedFormat) {
    let options = {
      format: selectedFormat,
      auto: document.getElementById('auto').checked,
      msec: document.getElementById('msec').value,

      link: document.getElementById('link').value,
      href: document.getElementById('href').value,
      name: document.getElementById('name').value
    };

#ifdef FIREFOX
    let setting = browser.storage.sync.set(options);
    setting.then(notifyUser, onError);
#endif
#ifdef CHROME
    chrome.storage.sync.set(options, notifyUser);
#endif
  }
}

/*
*   Restore HTML form values based on user options saved in browser.storage
*/
function restoreOptions() {

  function setPreferences (options) {
    document.getElementById(options.format || defaultFormat).checked = true;

    document.getElementById('auto').checked =
      (typeof options.auto === 'undefined') ? true : options.auto;

    document.getElementById('msec').value = options.msec || defaultTimeout;

    document.getElementById('link').value = options.link || 'link';
    document.getElementById('href').value = options.href || 'href';
    document.getElementById('name').value = options.name || 'name';

    console.log(options);
  }

#ifdef FIREFOX
  let getting = browser.storage.sync.get();
  getting.then(setPreferences, onError);
#endif
#ifdef CHROME
  chrome.storage.sync.get(function (options) {
    setPreferences(options);
  });
#endif
}

/*
*   Add event listeners for saving and restoring options
*/
document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
