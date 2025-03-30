from clip_retriever import CLIPRetriever
from media.models import Image

class TextSearch:
    def __init__(self, use_gpu=True):
        self.retriever = CLIPRetriever(use_gpu=use_gpu)

    def search(self, query_text, top_k=5):
        """
        Tìm kiếm hình ảnh dựa trên truy vấn văn bản.
        
        Args:
            query_text (str): Truy vấn văn bản để tìm kiếm.
            top_k (int): Số lượng kết quả trả về.
        
        Returns:
            list: Danh sách các kết quả tìm kiếm chứa thông tin hình ảnh.
        """
        # Trích xuất đặc trưng từ truy vấn văn bản
        query_features = self.retriever.process_text_query(query_text)
        if query_features is None:
            return []

        # Tìm kiếm hình ảnh tương tự
        results = self.retriever.retrieve_images(query_features, top_k)

        # Lấy thông tin hình ảnh từ cơ sở dữ liệu
        image_results = []
        for result in results:
            image_record = Image.objects.get(id=result['id'])
            image_results.append({
                'id': image_record.id,
                'title': image_record.title,
                'file': image_record.file.url,
                'distance': result['distance']
            })

        return image_results