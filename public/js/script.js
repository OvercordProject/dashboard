/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

$(window).load(() => {
  $('.loader').fadeOut('1000');
});

const errPopup = document.querySelector('.error-popup');
const errPopupMessage = document.querySelector('#err-message');
const nameInput = document.querySelector('#team-name');
const imgInput = document.querySelector('#team-image');
const nameErr = document.querySelector('#name-err');
const imgErr = document.querySelector('#img-err');
const editPanel = document.querySelector('.edit-team-panel');

function validTeamName(teamName, edit) {
  if (nameErr) {
    nameErr.innerHTML = '';
    if ((!teamName || teamName === '') && edit) return true;
    if (!teamName
      || teamName === ''
      || !(/^\w+$/.test(teamName)) // regex for alphanumeric characters and underscores
    ) {
      nameErr.innerHTML = 'Please enter a valid team name';
      return false;
    }
  }
  return true;
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return (url.protocol === 'http:' || url.protocol === 'https:') && (url.host === 'cdn.discordapp.com' || url.host === 'media.discordapp.net');
}

function validateFile(filename) {
  if (!filename.split('.').pop().match(/(jpg|jpeg|png|gif|webp)$/i)) {
    return false;
  }
  return true;
}

function checkIfImageExists(url, callback) {
  const img = new Image();
  img.src = url;

  if (img.complete) {
    callback(true);
  } else {
    img.onload = () => {
      callback(true);
    };
    img.onerror = () => {
      callback(false);
    };
  }
}

function displayTeamImage(value) {
  const teamImage = document.querySelector('.team-image');

  if (teamImage) {
    if (value) {
      if (!isValidHttpUrl(value) && imgErr) {
        imgErr.innerHTML = 'Please enter a valid URL (supports only Discord CDN images)';
        return false;
      }
      if (!validateFile(value) && imgErr) {
        imgErr.innerHTML = 'Invalid file type (supported: jpg, jpeg, png, gif, webp)';
        return false;
      }
      if (!checkIfImageExists(value, (exists) => {
        if (!exists && imgErr) {
          imgErr.innerHTML = 'Invalid image URL';
          teamImage.src = '/assets/images/discord.png';
        }
        return false;
      })) {
        teamImage.src = value;
        imgErr.innerHTML = '';
      }
    } else {
      teamImage.src = '/assets/images/discord.png';
      imgErr.innerHTML = '';
    }
  }
  return true;
}

function displayPopupError(message) {
  if (errPopup) {
    errPopup.classList.add('show-popup');
    errPopupMessage.innerHTML = message;
  }
}

function hidePopupError() {
  if (errPopup) {
    errPopup.classList.remove('show-popup');
    errPopupMessage.innerHTML = '';
  }
}

function sendTeamData() {
  nameErr.innerHTML = '';
  if (nameInput.value === '' && imgInput.value === '') {
    displayPopupError('Please enter a team name or an image URL');
    return;
  }
  if (!validTeamName(nameInput.value, nameErr)) return;
  if (!displayTeamImage(imgInput.value)) return;

  $.ajax({
    url: '/api/teams',
    type: 'POST',
    data: {
      name: nameInput.value,
      image: imgInput.value,
    },
    success: (data) => {
      errPopup.classList.remove('show-popup');
      errPopupMessage.innerHTML = '';
      window.location.href = `/teams/${data.name}`;
    },
    error: (err) => {
      errPopup.classList.add('show-popup');
      if (err.responseJSON) {
        errPopupMessage.innerHTML = err.responseJSON.message;
      } else {
        errPopupMessage.innerHTML = 'An error occurred';
      }
    },
  });
}

function inputKeyUp(e, edit) {
  if (e.keyCode === 13) {
    sendTeamData();
    return;
  }
  validTeamName(nameInput.value, edit);
  displayTeamImage(imgInput.value);
}

function hide(el) {
  if (el) {
    el.classList.toggle('hidden');
    return;
  }
  document.querySelector('.popup').classList.toggle('hidden');
}

function showPanel() {
  if (editPanel) {
    editPanel.classList.add('show');
  }
}

function hidePanel() {
  if (editPanel) {
    editPanel.classList.remove('show');
  }
}

const confirmPopup = document.querySelector('.popup-confirm-wrapper');
const noBtn = document.querySelector('#no');
const yesBtn = document.querySelector('#yes');

function deleteTeam() {
  if (confirmPopup) {
    confirmPopup.classList.add('show');
  }
  if (noBtn) {
    noBtn.addEventListener('click', () => {
      confirmPopup.classList.remove('show');
    });
  }
  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      confirmPopup.classList.remove('show');
      $.ajax({
        url: '/api/teams',
        type: 'DELETE',
        success: () => {
          window.location.href = '/';
        },
        error: (err) => {
          errPopup.classList.add('show-popup');
          if (err.responseJSON) {
            errPopupMessage.innerHTML = err.responseJSON.message;
          } else {
            errPopupMessage.innerHTML = 'An error occurred';
          }
        },
      });
    });
  }
}
