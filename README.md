# 🚀 Serverless Image Resizer using AWS S3 & Lambda

A fully **Serverless Image Resizer** built using **Amazon S3, AWS Lambda, Pillow, HTML, CSS, and JavaScript**.

This project demonstrates a complete **Serverless Architecture** where users upload an image through a responsive web interface. The image is stored in an Amazon S3 bucket, which automatically triggers an AWS Lambda function using **S3 Event Notifications**. Lambda resizes the image to **300 × 300** using the Pillow library and stores the resized image back into S3. Finally, the website displays both the original and resized images and provides an option to download the resized image.

---

# 📌 Features

- 📤 Upload images directly to Amazon S3
- ⚡ Automatic image resizing using AWS Lambda
- 🖼️ Resize images to 300 × 300 pixels
- ☁️ Fully Serverless Architecture
- 📂 Store original and resized images in Amazon S3
- 📥 Download resized images
- 🎨 Responsive Modern UI
- 🔄 Drag & Drop Upload
- 📊 Upload Progress Bar
- ⏳ Processing Indicator
- ✅ Success & Error Notifications

---

# 🏗️ Architecture

![Architecture](images/Screenshot%202026-07-17%20092751.png)

---

# 🔄 Project Workflow

```text
                User
                  │
                  ▼
       Open Static Website (S3)
                  │
                  ▼
        Select / Upload Image
                  │
                  ▼
 JavaScript uploads image directly
        to Amazon S3 Bucket
                  │
                  ▼
         uploads/ Folder in S3
                  │
          ObjectCreated Event
                  │
                  ▼
      S3 Event Notification
                  │
                  ▼
      AWS Lambda Function
                  │
                  ▼
   Resize Image using Pillow
                  │
                  ▼
 Store resized image in S3 Bucket
      (resized/ Folder)
                  │
                  ▼
 JavaScript polls resized image
                  │
                  ▼
 Display Original & Resized Image
                  │
                  ▼
 Download Resized Image
```

---

# 🛠️ AWS Services Used

| AWS Service | Purpose |
|-------------|---------|
| Amazon S3 | Hosts the static website and stores uploaded & resized images |
| AWS Lambda | Automatically resizes uploaded images |
| S3 Event Notification | Automatically triggers Lambda after image upload |
| IAM | Provides secure permissions to Lambda |
| CloudWatch | Stores execution logs for monitoring and debugging |
| Lambda Layer (Pillow) | Provides image processing library |

---

# 📁 Project Structure

```text
IMAGE_RESIZE_AWS/
│
├── index.html
├── style.css
├── script.js
├── lambda_function.py
├── README.md
│
└── images/
    ├── Screenshot 2026-07-17 092751.png
    ├── Screenshot 2026-07-17 094259.png
    ├── Screenshot 2026-07-17 094355.png
    └── Screenshot 2026-07-17 094426.png
```

---

# 💻 Website

## Home Page

![Home Page](images/Screenshot%202026-07-17%20094355.png)

---

## Upload & Resize Result

![Result](images/Screenshot%202026-07-17%20094426.png)

---

# ⚙️ How It Works

### Step 1
The user opens the static website hosted on **Amazon S3**.

### Step 2
The user selects or drags an image into the upload area.

### Step 3
JavaScript uploads the image directly to the **uploads/** folder inside the S3 bucket.

### Step 4
Amazon S3 stores the image successfully.

### Step 5
The **ObjectCreated** event automatically triggers an **S3 Event Notification**.

### Step 6
The S3 Event Notification invokes the **AWS Lambda** function.

### Step 7
Lambda downloads the uploaded image from Amazon S3.

### Step 8
The Pillow library resizes the image to **300 × 300** while maintaining the aspect ratio.

### Step 9
Lambda uploads the resized image into the **resized/** folder of the same S3 bucket.

### Step 10
JavaScript detects the resized image, displays both images on the webpage, and enables the download button.

---

# 📂 S3 Bucket Structure

```text
image-resizer-bucket

│── index.html
│── style.css
│── script.js
│
├── uploads/
│     ├── image1.jpg
│     └── image2.png
│
└── resized/
      ├── image1.jpg
      └── image2.png
```

---

# 📸 AWS Lambda

![Lambda Function](images/Screenshot%202026-07-17%20094259.png)

---

# 🧠 Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla JavaScript)
- Python
- Amazon S3
- AWS Lambda
- IAM
- Amazon CloudWatch
- S3 Event Notification
- Pillow (Python Imaging Library)

---

# 📈 Advantages

- Fully Serverless Architecture
- No EC2 Instance Required
- Automatic Scaling
- Pay Only for Usage
- Event-Driven Processing
- Responsive User Interface
- AWS Free Tier Friendly
- Fast Image Processing

---

# 🎯 Learning Outcomes

Through this project I learned:

- Static Website Hosting using Amazon S3
- Direct Browser Uploads to Amazon S3
- S3 Bucket Policies & CORS
- S3 Event Notifications
- AWS Lambda Functions
- Lambda Layers
- Pillow Image Processing
- IAM Roles & Permissions
- CloudWatch Logging
- Event-Driven Serverless Architecture

---

# 🚀 Future Improvements

- Multiple Resize Options
- Image Compression
- Watermark Images
- PNG ↔ JPEG Conversion
- User Authentication
- Presigned URLs
- CloudFront Integration
- Image Gallery
- Image History
- Delete Uploaded Images

---

# 👨‍💻 Author

**Darshan Desale**

AWS | Python | AI/ML | Full Stack Development

---

## ⭐ If you found this project useful, consider giving this repository a Star!
