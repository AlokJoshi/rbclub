//code specific to blogs
//in Blogs Admins should not have any special privileges. They can only create and edit their own blogs. They cannot edit or delete blogs of other users. They cannot see the list of blogs of other users. They can only see the list of their own blogs. They can only see the content of their own blogs. They cannot see the content of other users' blogs. They can only see the title and created date of other users' blogs in the blog list if they are not the author.
//The blog deletion/content approval etc features can be implemented in the 
//admins route in the future if needed. For now, we will keep it simple and only allow users to create and edit their own blogs. Admins will not have any special privileges in the blogs section.
async function getblogid() {

  try {

    const titleelement = document.getElementById('blogtitleid');
    if (!titleelement) {
      showCustomAlert('No blogtitleid found!');
      return;
    }
    const blogtitle = titleelement.value;
    const res = await fetch('/api/blogtitle', {
      method: 'POST',
      body: JSON.stringify({ blogtitle, playerid: userid }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json()
    if (!result.valid) {
      showCustomAlert(`Error:${result.message}`)
      return;
    }
    return result.blogid

  } catch (err) {
    showCustomAlert(`Error creating blog: ${err}`, 5);
    //first create a blogid after ensuring that the title is not duplicte
  }
}

async function deleteblog() {
  const blogselect = document.getElementById('blogselectid')
  const blogselectedoption = blogselect.options[blogselect.selectedIndex] 
  if (!blogselectedoption || !blogselectedoption.value) {
    showCustomAlert('Please select a blog to delete.', 3)
    return
  }
  const blogId = blogselectedoption.value
  const confirmDeletion = await showCustomYesNo('Are you sure you want to delete this blog? This action cannot be undone.') 
  if (!confirmDeletion) {
    return
  }
  try {
    const res = await fetch(`/api/blog/${blogId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (!result.success) {
      showCustomAlert(`Blog could not be deleted: ${result.message}`, 5);
      return;
    }
    showCustomAlert('Blog deleted successfully.', 3);
    // Optionally, you can remove the deleted blog from the select dropdown
    blogselect.remove(blogselect.selectedIndex);
  } catch (err) {
    showCustomAlert(`Error deleting blog: ${err}`, 5);
  }
}



async function submitblog() {

  const blogid = await getblogid()
  if (!blogid) {
    return;
  }

  const images = tinymce.activeEditor.dom.select('img')
  const imagesarray = []
  const imageElements = []
  let idx = 0
  tinymce.each(images, function (image) {
    // we do not want to upload images that are already uploaded and have a src that starts with our server url. 
    // We only want to upload new images that are added by the user and have a src that is a data URI or an external URL. 
    // So we will check if the image src starts with our server url and if it does, we will not add it to the imagesarray 
    // for uploading. We will only add images that do not start with our server url to the imagesarray for uploading. 
    // This way we can avoid uploading the same image multiple times and also avoid uploading images that are already 
    // hosted on our server.
    const serverUrl = window.location.origin; // get the server url dynamically
    if (image.src.startsWith(serverUrl)) {
      console.log(`Image with src ${image.src} is already hosted on our server. Skipping upload for this image.`);
      return; // skip this image as it is already uploaded and hosted on our server
    }
    // digital ocean reports this as the origin end-point: https://rbcstorage.sfo3.digitaloceanspaces.com
    // However the actual url that we use to access the image is hosted on a cdn and its url start with
    // https://rbcstorage.sfo3.cdn.digitaloceanspaces.com 
    // Hence we will check for both
    const digitalOceanOriginEndpoint = 'https://rbcstorage.sfo3.digitaloceanspaces.com';
    const digitalOceanCDNUrl = 'https://rbcstorage.sfo3.cdn.digitaloceans.com';
    if (image.src.startsWith(digitalOceanCDNUrl) || image.src.startsWith(digitalOceanOriginEndpoint)) {
      console.log(`Image with src ${image.src} is already hosted on our Digital Ocean space. Skipping upload for this image.`);
      return; // skip this image as it is already uploaded and hosted on our Digital Ocean space
    }


    imagesarray.push({
      image,
      imagesrc: image.src,
      originalname: `image-${idx}`
    })
    idx++
    // console.log(image)
    // console.log(image.src)
  })

  if (imagesarray.length > 0) {

    const formData = new FormData();
    await Promise.all(imagesarray.map(async (src, idx) => {
      const response = await fetch(src.imagesrc);          // works for both data URIs and http URLs
      const blob = await response.blob();
      const mime = blob.type || 'application/octet-stream';
      const extension = mime.split('/')[1] || 'bin';
      formData.append('blogimages', blob, `image-${idx}.${extension}`);
    }));
    formData.append('blogid', blogid)
    const res = await fetch(`/api/blog/images`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json()

    if (!result.success) {
      showCustomAlert(`Blog Images could not be saved: ${result.message}`, 5);
      return;
    }

    // console.log('Blog images saved successfully. Now saving blog content...')
    // console.log(`Number of images saved: ${result.count}`)
    // console.log(result.links)

    imagesarray.forEach(({ image, originalname }) => {
      const link = result.links.find(l => l.originalname.split('.')[0] === originalname)
      //if (link?.url) image.src = link.url;
      changeSelectedImageSrc(image, link?.url)
    });

  }

  //result.links is an object that returns the new image src for each old image src. 
  // We will replace the old image src with the new image src in the tinymce editor content
  const res2 = await fetch('/api/blog', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      blogid,
      blog: tinyMCE.activeEditor.getContent()
    })
  })
  if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
  const result3 = await res2.json()
  if (!result3.success)
    return showCustomAlert(`Error while saving blog: ${result3.message}`)

  showCustomAlert(`Blog saved successfully!`, 5);
}

function changeSelectedImageSrc(imageElement, newSrc) {
  const editor = tinymce.activeEditor;
  // Get the currently selected node
  const selectedNode = imageElement; // Assuming the image is the selected node, otherwise you can use editor.selection.getNode() to get the selected node in the editor

  // Check if the selected node is an image
  if (selectedNode && selectedNode.tagName === 'IMG') {
    // Use the DOM utility to set the 'src' attribute
    editor.dom.setAttrib(selectedNode, 'src', newSrc);
    // Important: call focus() after setting the attribute in some TinyMCE versions/integrations
    editor.focus();
  } else {
    showCustomAlert('The image source could not be changed.');
  }
}

function cancelblog() {
  window.open('/members')
}

function createhand() {
  const handmodal = document.getElementById('handmodal')
  if (handmodal) {
    handmodal.style.display = 'block';
  }
}

function exitHand() {
  showCustomAlert(`Please note that the hand you created will not be saved 
    if you cancel out of Blog creation. However, you will be able to continue with the 
    hand creation if you again click on the "Create Hand" button.`, 7)
  const handmodal = document.getElementById('handmodal')
  if (handmodal) {
    handmodal.style.display = 'none'
  }
}

function closehandmodal() {
  const handmodal = document.getElementById('handmodal')  
  if (handmodal) {
    handmodal.style.display = 'none'
  }
}


function setupforcreateblog() {
  const blogselect = document.getElementById('blogselectid')
  blogselect.style.display = 'none'
  const blogtitle = document.getElementById('blogtitleid')
  blogtitle.style.display = 'block'
}

async function setupforeditblog() {
  const blogselect = document.getElementById('blogselectid')
  blogselect.style.display = 'block'
  const blogtitle = document.getElementById('blogtitleid')
  blogtitle.style.display = 'none'
  try {
    const response = await fetch(`/api/bloglist/${userid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const blogs = await response.json()
    const bloglist = document.getElementById('blogselectid')
    bloglist.innerHTML = '<option value="" disabled selected>Select a blog to edit</option>'
    blogs.blogs.forEach(blog => {
      const option = document.createElement('option')
      option.value = blog.id
      option.textContent = blog.title
      bloglist.appendChild(option)
    })
    if (bloglist.options.length === 1) {
      showCustomAlert('No blogs available to edit probably since you have not created any blogs yet. Please create a blog first.', 5)
    }
  } catch (err) {
    console.error('Error fetching blogs:', err)
  }
}

async function populateblogcontent() {
  const blogselect = document.getElementById('blogselectid')
  const blogselectedoption = blogselect.options[blogselect.selectedIndex]
  const blogtitle = document.getElementById('blogtitleid')
  // const blogauthor = document.getElementById('blogauthorid')
  if (!blogselectedoption || !blogselectedoption.value) {
    return
  }
  const blogId = blogselectedoption.value
  try {
    const response = await fetch(`/api/blogs/${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const payload = await response.json()
    const blog = payload?.blog
    if (!blog) {
      throw new Error('Blog not found in response')
    }
    blogtitle.value = blog.title || ''
    // blogauthor.value = blog.author || ''

    const editor = tinymce.activeEditor || tinymce.get('mytextarea')
    const content = typeof blog.blog === 'string' ? blog.blog : JSON.stringify(blog.blog ?? '')
    if (editor) {
      editor.setContent(content)
    } else {
      const textarea = document.getElementById('mytextarea')
      if (textarea) {
        textarea.value = content
      }
    }
  } catch (err) {
    console.error('Error fetching blog content:', err)
  }
}

async function decideAboutBloggers() {
  [sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname] = await getSessionDetails()
  // Base the decision on global variables set during login or checks
  console.log(sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname)
  // Check if the session exists
  // const [sessionid,securelogin]= await isUserLoggedIn()

  // remove blurred effect from all content classes
  const contentElements = document.getElementsByClassName('content');
  const show = (sessionId && insecurelogin) || securelogin;
  for (let i = 0; i < contentElements.length; i++) {
    if (!show) {
      contentElements[i].classList.add('blurred');
    } else {
      contentElements[i].classList.remove('blurred');
    }
  }

  if (!show) {
    showCustomAlert('You must be logged in as an Admin or be a member of the club to access this page.', 7)
    console.log("User is not an Admin or not logged in.");
  }

}

function pasteCardImage(what) {
  try {
    const imgSource = 'images/gallery/Suits/' + what + '.png';
    console.log('Inserting image with source:', imgSource);
    const img = document.createElement('img');
    img.src = imgSource;
    img.style.width = '.7em';
    img.style.height = 'auto';
    img.alt = what;
    const editor = tinymce.activeEditor;
    if (editor) {
      editor.insertContent(img.outerHTML);
    } else {
      showCustomAlert('TinyMCE editor not found. Cannot insert image.');
    }
  } catch (err) {
    console.error('Error inserting image:', err);
  }
}

function fixdirection(direction) {
  const divs = document.querySelectorAll('.directiondiv');
  divs.forEach(div => {
    if (div.textContent.toLowerCase()[0] === direction.toLowerCase()) {
      div.classList.add('active');
    } else {
      div.classList.remove('active');
    }
  });
}
function removecards(event) {
  const target = event.target;
  const id = target.id;
  if (id && id.endsWith('cards')) {
    //first put the cards back into the card selection area
    const cards = target.textContent.trim().split('').filter(c => c);
    suit = id[1] == 'h' ? 'heart' : id[1] === 'd' ? 'diamond' : id[1] === 'c' ? 'club' : id[1] === 's' ? 'spade' : null;
    suitrow = document.getElementById(`${suit}`) //suitid should be spade,heart,diamond,club
    const cardElements = suitrow.querySelectorAll('td');
    cards.forEach(card => {
      cardElements.forEach(td => {
        if (td.textContent.trim() === card) {
          td.style.visibility = 'visible';
        }
      });
    });
    target.textContent = ''; //remove cards from the hand
    target.parentElement.dataset.count = '0'; //reset count of cards in the hand
  }
}
function otherDirectionsCanAccommodateCard(direction) {
  const directions = ['n', 'e', 's', 'w'];
  const otherDirections = directions.filter(d => d !== direction);
  // Implement logic to check if other directions can accommodate the suit
  // This is a placeholder implementation; adjust according to your requirements
  return otherDirections.some(d => {
    const table = document.getElementById(d);
    if (table) {
      const count = parseInt(table.dataset.count || '0');
      return count < 13;
    }
    return false;
  });
}


async function selectcard(event) {
  const target = event.target;
  if (target.tagName === 'TD') {
    const card = target.textContent.trim();
    const suitElementId = target.parentElement.id;
    const suit = suitElementId ? suitElementId[0].toLowerCase() : '';
    const suitElement = document.getElementById(suitElementId);
    const direction = document.querySelector('.directiondiv.active')?.textContent.trim().toLowerCase()[0];
    const otherDirectionsCannotAccommodateThisSuit = !otherDirectionsCanAccommodateCard(direction);
    const activeTable = document.querySelector(`#${direction}`);
    const cardsSpan = activeTable.querySelector(`#${direction}${suit}cards`);
    
    if (otherDirectionsCannotAccommodateThisSuit && activeTable && cardsSpan) {
      
      // check if the user wants all the remaining cards of this suit to go to the active direction and if yes, then we will allow the selection of this card even if the other directions cannot accommodate this suit. We will show a confirmation dialog to the user in this case. If the user confirms, then we will allow the selection of this card and all the remaining cards of this suit will go to the active direction. If the user cancels, then we will not allow the selection of this card and we will show an alert to the user that they cannot select this card as the other directions cannot accommodate this suit.
      const confirmSelection = await showCustomYesNo(`The other directions cannot accommodate this suit. Do you want to select this card and assign all remaining cards of this suit to the ${direction.toUpperCase()} direction?`);
      if (confirmSelection) {
        //distribute all the remaining cards of the suit in this direction
        if (suitElement) {
          //select all divs in the suit row that are not hidden and add them to the active direction
          const cardElements = suitElement.querySelectorAll('td');
          cardElements.forEach(td => {
            if (td.style.visibility !== 'hidden') {
                  cardsSpan.textContent += ` ${td.textContent.trim()}`;
                  td.style.visibility = 'hidden';
                  activeTable.dataset.count = (parseInt(activeTable.dataset.count || '0') + 1).toString();
                }
          });
          suitElement.dataset.remaining = '0'; //set remaining cards of this suit to 0 as all cards of this suit are now assigned to the active direction
          cardsSpan.textContent = sortcards(cardsSpan.textContent);
        }
      }
    }
    
    if (suitElement) {
      const remaining = parseInt(suitElement.dataset.remaining || '0'); 
      if (remaining > 0) {
        suitElement.dataset.remaining = (remaining - 1).toString(); //decrement remaining cards of that suit
      } else {
        showCustomAlert(`No more cards of suit ${suit} can be selected.`, 3);
        return;
      }
    }

    if (activeTable && activeTable.dataset.count < 13) { // max 13 cards in a hand
      //decide which row to use
      if (cardsSpan) {
        cardsSpan.textContent += ` ${card}`;
        cardsSpan.textContent = sortcards(cardsSpan.textContent); // remove extra spaces
        target.style.visibility = 'hidden'; // hide the card after selecting
        activeTable.dataset.count = (parseInt(activeTable.dataset.count || '0') + 1).toString(); // increment count of cards in the active table
      }
    } else {
      showCustomAlert('You cannot select more than 13 cards for a hand.', 3);
    }
  }
}

function sortcards(cards) {
  //AKQJT98765432 in that order
  const cardArray = cards.trim().split(''); // split by space and remove empty strings
  cardArray.sort((a, b) => {
    const order = 'AKQJT98765432';
    return order.indexOf(a) - order.indexOf(b);
  });
  return cardArray.join('');
}

// snapdom related
// Save as PNG
function saveAsPNG() {
  snapdom.download(element, {
    format: 'png',
    filename: 'capture-demo',
  }).catch(function (err) {
    console.error('Save failed:', err);
  });
}

// Save as JPG
function saveAsJPG() {
  snapdom.download(element, {
    format: 'jpg',
    filename: 'capture-demo',
    backgroundColor: '#fff',
    quality: 0.92
  }).catch(function (err) {
    console.error('Save failed:', err);
  });
}

// Preview image
function pasteImage() {

  //before taking a picture 
  //remove the active class
  const activeDiv = document.querySelector('.directiondiv.active');
  if (activeDiv) {
    activeDiv.classList.remove('active');
  }

  const element = document.getElementById('handdisplay');
  // const previewElement = document.getElementById('preview');
  snapdom.toImg(element, {
    format: 'png',
    scale: 0.7
  }).then(function (img) {
    // previewElement.src = img.src;
    // previewElement.style.display = 'block';
    tinyMCE.activeEditor.execCommand('mceInsertContent', false, `<img src="${img.src}" style="max-width:100%;height:auto;" />`);
  }).catch(function (err) {
    showCustomAlert('Failed to capture the hand display. Please try again.', 5);
    console.error('Paste image failed:', err);
  });
}

// end of snapdom related
decideAboutBloggers()