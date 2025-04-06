# FileSharing

A secure and anonymous file sharing platform built with Express.js. Upload and share files easily with generated download links.

## 🚀 Features

-   Anonymous file uploading
-   Secure file storage using MinIO
-   Unique download link generation
-   Rate limiting for API protection
-   Modern and responsive UI
-   Support for various file types
-   No registration required

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/art3m4ik3/filesharing-backend.git
cd filesharing-backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
   Create a `.env` file in the backend directory with the following:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
MINIO_ENDPOINT=your_minio_endpoint
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=anon-uploads
MINIO_REGION=us-east-1
MINIO_USE_SSL=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

4. Start the backend server:

```bash
npm run start:dev
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.
