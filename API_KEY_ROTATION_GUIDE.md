# API Key Rotation System

## Tổng quan

Hệ thống xoay vòng API key được thiết kế để giải quyết vấn đề rate limiting khi sử dụng Gemini API. Thay vì sử dụng một API key duy nhất, hệ thống sẽ tự động xoay vòng giữa nhiều keys để phân bổ tải và tránh bị giới hạn tốc độ.

## Tính năng

- ✅ **Load Balancing**: Tự động phân bổ requests giữa các API keys
- ✅ **Rate Limit Protection**: Tránh rate limiting bằng cách cooldown giữa các requests
- ✅ **Health Monitoring**: Theo dõi trạng thái của từng API key
- ✅ **Auto Recovery**: Tự động phục hồi keys bị lỗi sau 5 phút
- ✅ **Statistics Tracking**: Theo dõi usage statistics cho từng key
- ✅ **Real-time Monitoring**: API endpoints để monitor trạng thái keys

## Cấu hình

### 1. Environment Variables

Thêm các API keys vào file `.env`:

```bash
# Primary key (bắt buộc)
GEMINI_API_KEY=your_primary_gemini_api_key_here

# Additional keys (tùy chọn, có thể thêm bao nhiêu cũng được)
GEMINI_API_KEY_1=your_second_gemini_api_key_here
GEMINI_API_KEY_2=your_third_gemini_api_key_here  
GEMINI_API_KEY_3=your_fourth_gemini_api_key_here
GEMINI_API_KEY_4=your_fifth_gemini_api_key_here
# ... và nhiều hơn nữa
```

### 2. Naming Convention

- `GEMINI_API_KEY`: Key chính (bắt buộc)
- `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, ...: Keys phụ
- Hệ thống sẽ tự động detect tất cả keys theo pattern này

## Cách hoạt động

### Round-Robin Algorithm

```
Request 1 → Key 1
Request 2 → Key 2  
Request 3 → Key 3
Request 4 → Key 1 (quay lại từ đầu)
...
```

### Request Cooldown

- Mỗi key có cooldown period 1 giây giữa các requests
- Nếu tất cả keys đều trong cooldown, hệ thống sẽ chờ key sẵn sàng nhất

### Health Management

- Keys tự động bị đánh dấu "unhealthy" khi gặp rate limit errors
- Unhealthy keys bị loại khỏi rotation trong 5 phút
- Sau 5 phút, key sẽ được khôi phục và reset statistics

## API Monitoring

### 1. Xem thống kê

```bash
GET /api/admin/api-key-stats/stats
Authorization: Bearer <your-jwt-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalKeys": 4,
    "healthyKeys": 4,
    "currentKeyIndex": 2,
    "keyStats": [
      {
        "index": 0,
        "requestCount": 15,
        "lastUsed": "2024-01-01T10:30:00.000Z",
        "isHealthy": true,
        "keyPreview": "AIzaSyB..."
      },
      {
        "index": 1,
        "requestCount": 12,
        "lastUsed": "2024-01-01T10:29:45.000Z", 
        "isHealthy": true,
        "keyPreview": "AIzaSyC..."
      }
      // ...
    ]
  }
}
```

### 2. Reset thống kê

```bash
POST /api/admin/api-key-stats/reset
Authorization: Bearer <your-jwt-token>
```

## Services sử dụng API Key Rotation

Các services sau đã được cập nhật để sử dụng hệ thống xoay vòng API key:

1. **TTSService** (`src/services/ai/tts.service.ts`)
   - Sử dụng cho Text-to-Speech generation
   
2. **AIImageService** (`src/services/ai/image.service.ts`)
   - Sử dụng cho image generation và prompt processing
   
3. **GeminiService** (`src/services/ai/gemini.service.ts`)
   - Sử dụng cho story generation

## Error Handling

### Rate Limit Detection

Hệ thống tự động detect các lỗi rate limit thông qua:
- HTTP status code 429
- Error messages chứa: 'quota', 'rate', 'limit'

### Auto Recovery

- Keys bị lỗi sẽ được đánh dấu unhealthy
- Sau 5 phút, key tự động được khôi phục
- Request count được reset khi khôi phục

## Best Practices

### 1. Số lượng Keys

- **Minimum: 2-3 keys** cho basic usage
- **Recommended: 4-6 keys** cho high-volume applications
- **Maximum: Không giới hạn** (phụ thuộc vào Gemini quotas)

### 2. Key Management

```bash
# Tốt: Đặt tên keys theo thứ tự
GEMINI_API_KEY=primary_key
GEMINI_API_KEY_1=second_key
GEMINI_API_KEY_2=third_key

# Tránh: Bỏ sót numbers
GEMINI_API_KEY=primary_key
GEMINI_API_KEY_1=second_key
GEMINI_API_KEY_3=third_key  # ❌ Missing GEMINI_API_KEY_2
```

### 3. Monitoring

- Thường xuyên check `/api/admin/api-key-stats/stats`
- Monitor `healthyKeys` count
- Reset stats định kỳ nếu cần

## Troubleshooting

### Vấn đề: "No Gemini API keys found"

**Nguyên nhân:** Không có API key nào được cấu hình

**Giải pháp:**
```bash
# Đảm bảo có ít nhất GEMINI_API_KEY
GEMINI_API_KEY=your_api_key_here
```

### Vấn đề: Tất cả keys bị rate limit

**Nguyên nhân:** Quá nhiều requests trong thời gian ngắn

**Giải pháp:**
- Thêm nhiều API keys hơn
- Giảm request frequency
- Check quotas trong Google Cloud Console

### Vấn đề: Keys không được rotate

**Nguyên nhân:** Có thể có lỗi trong service initialization

**Giải pháp:**
```bash
# Restart application
npm run start:dev

# Check logs cho initialization errors
```

## Configuration Tuning

### Cooldown Period

```typescript
// src/services/api-key-manager/api-key-manager.service.ts
private readonly REQUEST_COOLDOWN = 1000; // 1 second (có thể adjust)
```

### Recovery Time

```typescript
// src/services/api-key-manager/api-key-manager.service.ts
setTimeout(() => {
  keyInfo.isHealthy = true;
  keyInfo.requestCount = 0;
  this.logger.log('API key marked as healthy again');
}, 5 * 60 * 1000); // 5 minutes (có thể adjust)
```

## Logs Monitoring

```bash
# Successful key rotation
[APIKeyManagerService] Using API key 2 (15 requests)

# Key marked unhealthy  
[APIKeyManagerService] Marked API key as unhealthy: TTS Error: Quota exceeded

# Key recovery
[APIKeyManagerService] API key marked as healthy again

# All keys rate limited
[APIKeyManagerService] All keys rate limited, waiting 500ms
```

## Security Notes

- API keys không bao giờ được log đầy đủ (chỉ preview 8 ký tự đầu)
- Stats API yêu cầu authentication
- Keys được store an toàn trong environment variables

---

## Kết luận

Hệ thống API Key Rotation giúp:
- ✅ Tránh rate limiting hiệu quả  
- ✅ Tăng throughput cho application
- ✅ Monitoring và debugging dễ dàng
- ✅ Tự động recovery khi có lỗi
- ✅ Scale linh hoạt với nhiều keys

Đảm bảo configure đúng environment variables và monitor thường xuyên để đạt hiệu quả tối ưu. 