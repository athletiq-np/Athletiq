"""
Custom pagination classes for API responses.
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that returns responses in the same format
    as the existing Node.js API for frontend compatibility.
    """
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return paginated response in the format expected by the frontend.
        """
        return Response({
            'success': True,
            'message': 'Data retrieved successfully',
            'results': data,  # Use 'results' key for compatibility
            'pagination': {
                'currentPage': self.page.number,
                'totalPages': self.page.paginator.num_pages,
                'totalCount': self.page.paginator.count,
                'limit': self.page_size,
                'hasNext': self.page.has_next(),
                'hasPrev': self.page.has_previous(),
            }
        })


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class for list views.
    """
    page_size = 50
    page_size_query_param = 'limit'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return paginated response in the format expected by the frontend.
        """
        return Response({
            'success': True,
            'message': 'Data retrieved successfully',
            'results': data,  # Use 'results' key for compatibility
            'pagination': {
                'currentPage': self.page.number,
                'totalPages': self.page.paginator.num_pages,
                'totalCount': self.page.paginator.count,
                'limit': self.page_size,
                'hasNext': self.page.has_next(),
                'hasPrev': self.page.has_previous(),
            }
        })