import os
import unittest
from unittest.mock import patch, MagicMock

# Tạo mock để có thể test mà không cần file thực tế
# Điều này giúp CI/CD có thể chạy test mà không cần dữ liệu thực

class TestCLIPRetrieval(unittest.TestCase):
    """Test cases cho module CLIP Retrieval."""
    
    @patch('clip_retrieval.run_test.CLIPRetriever')
    def test_run_test_basic(self, mock_retriever_class):
        """Test cơ bản cho hàm run_test."""
        from clip_retrieval.run_test import run_test
        
        # Setup mock
        mock_retriever = MagicMock()
        mock_retriever.retrieve_images.return_value = [
            {"file": "test1.jpg", "similarity_score": 0.9},
            {"file": "test2.jpg", "similarity_score": 0.8}
        ]
        mock_retriever_class.return_value = mock_retriever
        
        # Thiết lập đường dẫn index giả
        index_path = "dummy_index_path.faiss"
        mapping_path = "dummy_mapping_path.pkl"
        
        # Tạo file giả để kiểm tra tồn tại
        with patch('os.path.exists', return_value=True):
            # Chạy test
            results = run_test(
                index_path=index_path,
                mapping_path=mapping_path,
                queries=["test query"],
                top_k=2,
                use_gpu=False,
                save_results=False
            )
        
        # Kiểm tra kết quả
        self.assertIsNotNone(results)
        self.assertIn("test query", results)
        self.assertEqual(len(results["test query"]), 2)
        
        # Kiểm tra các method được gọi đúng
        mock_retriever_class.assert_called_once_with(index_path, mapping_path, use_gpu=False)
        mock_retriever.retrieve_images.assert_called_once_with("test query", top_k=2)

if __name__ == '__main__':
    unittest.main()