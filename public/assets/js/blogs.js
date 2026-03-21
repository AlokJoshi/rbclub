//code specific to blogs
async function getblogid() {

  try {

    const titleelement = document.getElementById('blogtitleid');
    if (!titleelement) {
      showCustomAlert('No blogtitleid found!');
      return;
    }
    const blogtitle = titleelement.value;
    const res = await fetch('/api/blog', {
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
    // imageElements.push(image)
    imagesarray.push({
      image,
      imagesrc: image.src,
      originalname: `image-${idx}`
    })
    idx++
    console.log(image)
    // console.log(image.src)
  })
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

  console.log('Blog images saved successfully. Now saving blog content...')
  console.log(`Number of images saved: ${result.count}`)
  console.log(result.links)

  imagesarray.forEach(({ image, originalname }) => {
    const link = result.links.find(l => l.originalname.split('.')[0]=== originalname)
    //if (link?.url) image.src = link.url;
    changeSelectedImageSrc(image,link?.url)
  });

  //result.links is an object that returns the new image src for each old image src. 
  // We will replace the old image src with the new image src in the tinymce editor content
  const res2 = await fetch('/api/blog',{
    method:'PUT',
    headers:{
      'Content-Type': 'application/json'
    },
    body:JSON.stringify({
      blogid,
      blog: tinyMCE.activeEditor.getContent()
    })
  })
  if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
  const result3 = await res2.json()
  if(!result3.success) 
    return showCustomAlert(`Error while saving blog: ${result3.message}`)

  console.log(result)
}

function changeSelectedImageSrc(imageElement,newSrc) {
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
    const response = await fetch('/api/bloglist', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const blogs = await response.json()
    const bloglist = document.getElementById('blogselectid')
    bloglist.innerHTML = '<option value="" disabled selected>Select a blog to edit</option>'
    blogs.blogs.forEach(blog => {
      if (isAdmin || blog.playerid === userid) {
        //show all blogs to admin, show only own blogs to non-admins
        const option = document.createElement('option')
        option.value = blog.id
        option.textContent = blog.title
        bloglist.appendChild(option)
      }
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
  const blogauthor = document.getElementById('blogauthorid')
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
    blogauthor.value = blog.author || ''

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

function tinymcechange() {
  var images = tinymce.activeEditor.dom.select('img')
  tinymce.each(images, function (image) {
    console.log(image.src)
  })
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
function removecards(event){
  const target = event.target;
  const id=target.id;
  if(id && id.endsWith('cards')){
    //first put the cards back into the card selection area
    const cards = target.textContent.trim().split('').filter(c => c);
    suit = id[1] == 'h' ? 'heart' : id[1]==='d' ? 'diamond' : id[1]==='c' ? 'club' : id[1]==='s' ? 'spade' : null;
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

function selectcard(event) {
  const target = event.target;
  if (target.tagName === 'TD') {
    const card = target.textContent.trim();
    const suitElementId = target.parentElement.id;
    const suit = suitElementId ? suitElementId[0].toLowerCase() : '';
    const direction = document.querySelector('.directiondiv.active')?.textContent.trim().toLowerCase()[0];
    const activeTable = document.querySelector(`#${direction}`);
    if (activeTable && activeTable.dataset.count < 13) { // max 13 cards in a hand
      //decide which row to use
      const cardsSpan = activeTable.querySelector(`#${direction}${suit}cards`);
      if (cardsSpan) {
        cardsSpan.textContent += ` ${card}`;
        cardsSpan.textContent = sortcards(cardsSpan.textContent); // remove extra spaces
        target.style.visibility = 'hidden'; // hide the card after selecting
        activeTable.dataset.count = (parseInt(activeTable.dataset.count || '0') + 1).toString(); // increment count of cards in the active table
      }
    }else {
      showCustomAlert('You cannot select more than 13 cards for a hand.', 3);
    }
  }
}
function sortcards(cards) {
  //AKQJT98765432 in that order
  const cardArray = cards.trim().split(''); // split by space and remove empty strings
  cardArray.sort((a, b) => {
    const order='AKQJT98765432';
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
  }).catch(function(err) {
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
  }).catch(function(err) {
    console.error('Save failed:', err);
  });
}

// Preview image
function previewImage() {

  //before taking a picture 
  //remove the active class
  const activeDiv = document.querySelector('.directiondiv.active');
  if (activeDiv) {
    activeDiv.classList.remove('active');
  }

  const element = document.getElementById('handdisplay');
  const previewElement = document.getElementById('preview');
  snapdom.toImg(element, { 
    format: 'png', 
    scale: 0.7 
  }).then(function(img) {
    previewElement.src = img.src;
    previewElement.style.display = 'block';
    tinyMCE.activeEditor.execCommand('mceInsertContent', false, `<img src="${img.src}" style="max-width:100%;height:auto;" />`);
  }).catch(function(err) {
    console.error('Preview failed:', err);
  });
}

// end of snapdom related
decideAboutBloggers()