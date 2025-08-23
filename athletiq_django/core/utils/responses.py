"""
Utility functions for consistent API responses.
"""
from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Success", status_code=status.HTTP_200_OK, **kwargs):
    """
    Create a successful API response in the format expected by the frontend.
    
    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
        **kwargs: Additional fields to include in response
    
    Returns:
        Response object with consistent format
    """
    response_data = {
        'success': True,
        'message': message
    }
    
    if data is not None:
        response_data['data'] = data
    
    # Add any additional fields
    response_data.update(kwargs)
    
    return Response(response_data, status=status_code)


def error_response(message="Error", status_code=status.HTTP_400_BAD_REQUEST, errors=None, **kwargs):
    """
    Create an error API response in the format expected by the frontend.
    
    Args:
        message: Error message
        status_code: HTTP status code
        errors: Detailed error information
        **kwargs: Additional fields to include in response
    
    Returns:
        Response object with consistent error format
    """
    response_data = {
        'success': False,
        'message': message,
        'status': status_code
    }
    
    if errors:
        response_data['errors'] = errors
    
    # Add any additional fields
    response_data.update(kwargs)
    
    return Response(response_data, status=status_code)


def created_response(data=None, message="Resource created successfully"):
    """
    Create a 201 Created response.
    """
    return success_response(data, message, status.HTTP_201_CREATED)


def updated_response(data=None, message="Resource updated successfully"):
    """
    Create a 200 OK response for updates.
    """
    return success_response(data, message, status.HTTP_200_OK)


def deleted_response(message="Resource deleted successfully"):
    """
    Create a 200 OK response for deletions.
    """
    return success_response(None, message, status.HTTP_200_OK)


def not_found_response(message="Resource not found"):
    """
    Create a 404 Not Found response.
    """
    return error_response(message, status.HTTP_404_NOT_FOUND)


def unauthorized_response(message="Authentication required"):
    """
    Create a 401 Unauthorized response.
    """
    return error_response(message, status.HTTP_401_UNAUTHORIZED)


def forbidden_response(message="Permission denied"):
    """
    Create a 403 Forbidden response.
    """
    return error_response(message, status.HTTP_403_FORBIDDEN)


def validation_error_response(errors, message="Validation failed"):
    """
    Create a 400 Bad Request response for validation errors.
    """
    return error_response(message, status.HTTP_400_BAD_REQUEST, errors=errors)


def server_error_response(message="Internal server error"):
    """
    Create a 500 Internal Server Error response.
    """
    return error_response(message, status.HTTP_500_INTERNAL_SERVER_ERROR)