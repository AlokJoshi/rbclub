//code specific to blogs
async function getblogid(){

  try{
  
    const titleelement = document.getElementById('blogtitleid');
    if(!titleelement) {
      showCustomAlert('No blogtitleid found!');
      return;
    }
    const blogtitle = titleelement.value;
    const res = await fetch('/api/blog', {
      method:POST,
      body:JSON.stringify({blogtitle})
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
  
    const result = await res.json()
    if(!result.valid){
      showCustomAlert(`Error:${result.message}`)
      return;
    }
    return result.blogid
  
  }catch(err){
    showCustomAlert(`Error creating blog: ${err}`,5);
  //first create a blogid after ensuring that the title is not duplicte
  }
}
async function submitblog(){

  const blogid = await getblogid()
  if(!blogid){
    return;
  }

  const images = tinymce.activeEditor.dom.select('img')
  const imagesarray=[]
  tinymce.each(images, function(image) {
    imagesarray.push(image.src)
    //once this image is saved to our server
    //we will get the new image.src and change the image
    //source of the document in the tinymce.activeEditor
    console.log(image.src)
  })
  const formData = new FormData();
  formData.append(`blogimages`, imagesarray);
  formData.append('blogid',blogid)
  const res = await fetch(`/api/blog/images/${blogid}`, {
    method: 'POST', 
    body: formData
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json()
  if(!result.valid){
    showCustomAlert(`Blog Images could not be saved: ${result.message}`, 5);
    return;
  }
  //result.links is an object that returns the new image src for each old image src. 
  // We will replace the old image src with the new image src in the tinymce editor content

  console.log(result)
}

function cancelblog(){
  window.open('/members')
}

function setupforcreateblog(){
  const blogselect = document.getElementById('blogselectid')  
  blogselect.style.display = 'none'
  const blogtitle = document.getElementById('blogtitleid')
  blogtitle.style.display = 'block'
}

async function setupforeditblog(){
  const blogselect = document.getElementById('blogselectid')  
  blogselect.style.display = 'block'
  const blogtitle = document.getElementById('blogtitleid')
  blogtitle.style.display = 'none'
  try{
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
      if(isAdmin || blog.playerid === userid){
        //show all blogs to admin, show only own blogs to non-admins
        const option = document.createElement('option')
        option.value = blog.id
        option.textContent = blog.title
        bloglist.appendChild(option)
      }
    })
    if(bloglist.options.length === 1){
      showCustomAlert('No blogs available to edit probably since you have not created any blogs yet. Please create a blog first.', 5)
    }
  }catch(err){
    console.error('Error fetching blogs:', err)
  }
}

async function populateblogcontent(){
  const blogselect = document.getElementById('blogselectid')
  const blogselectedoption = blogselect.options[blogselect.selectedIndex]
  const blogtitle= document.getElementById('blogtitleid')
  const blogauthor= document.getElementById('blogauthorid')
  if(!blogselectedoption || !blogselectedoption.value){
    return
  }
  const blogId = blogselectedoption.value
  try{
    const response = await fetch(`/api/blogs/${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const payload = await response.json()
    const blog = payload?.blog
    if(!blog){
      throw new Error('Blog not found in response')
    }
    blogtitle.value = blog.title || ''
    blogauthor.value = blog.author || ''

    const editor = tinymce.activeEditor || tinymce.get('mytextarea')
    const content = typeof blog.blog === 'string' ? blog.blog : JSON.stringify(blog.blog ?? '')
    if(editor){
      editor.setContent(content)
    }else{
      const textarea = document.getElementById('mytextarea')
      if(textarea){
        textarea.value = content
      }
    }
  }catch(err){
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

function tinymcechange(){
  var images = tinymce.activeEditor.dom.select('img')
  tinymce.each(images, function(image) {
    console.log(image.src)
  })
}

decideAboutBloggers()