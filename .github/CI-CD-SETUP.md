# Pixoria CI/CD Setup

Dự án này đã được cấu hình với GitHub Actions để tự động hóa các quy trình kiểm thử, xây dựng và triển khai.

## Các Workflows

1. **Backend CI** (.github/workflows/backend-ci.yml)
   - Chạy khi có thay đổi trong thư mục `webImage/`
   - Thực hiện kiểm tra code với flake8
   - Chạy các bài kiểm thử Django

2. **Frontend CI** (.github/workflows/frontend-ci.yml)
   - Chạy khi có thay đổi trong thư mục `frontend/`
   - Kiểm tra linting
   - Kiểm tra build

3. **Docker Compose Check** (.github/workflows/docker-compose-check.yml)
   - Kiểm tra cấu hình Docker Compose
   - Xây dựng và kiểm tra chạy tất cả các container

4. **Deployment** (.github/workflows/deploy.yml)
   - Xây dựng và đẩy Docker images lên Docker Hub
   - Triển khai ứng dụng lên môi trường production

## Cấu hình Secrets

Để các workflows hoạt động đúng, bạn cần thêm các secrets sau trong mục GitHub repository settings -> Secrets and variables -> Actions:

### Cho Docker Hub
- `DOCKER_HUB_USERNAME`: Tên người dùng Docker Hub
- `DOCKER_HUB_ACCESS_TOKEN`: Token truy cập Docker Hub (không phải mật khẩu)

### Cho Deployment (Tùy thuộc vào phương pháp triển khai bạn chọn)

#### Option 1: SSH Deployment
- `SSH_HOST`: Địa chỉ IP hoặc hostname của server
- `SSH_USERNAME`: Tên người dùng SSH
- `SSH_PRIVATE_KEY`: Khóa SSH private
- `SSH_PORT`: Cổng SSH (thường là 22)

#### Option 2: Kubernetes Deployment
- `KUBE_CONFIG`: Nội dung của file kubeconfig

## Tùy chỉnh Workflows

Các file workflow đã được tạo với các tùy chọn thông dụng nhất, nhưng bạn nên tùy chỉnh theo nhu cầu cụ thể:

1. Trong file `deploy.yml`, bỏ comment và cấu hình phương pháp triển khai phù hợp (SSH hoặc Kubernetes)
2. Nếu bạn có các bài kiểm thử frontend, bỏ comment phần chạy tests trong `frontend-ci.yml`
3. Cân nhắc thêm các bước kiểm tra bảo mật như dependency scanning

## Tài liệu tham khảo
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)