from rest_framework import serializers


class TranslateTextSerializer(serializers.Serializer):
    """Serializer for text translation requests"""
    text = serializers.CharField(max_length=10000)
    target_language = serializers.CharField(max_length=10)
    source_language = serializers.CharField(max_length=10, required=False)


class TranslateBatchSerializer(serializers.Serializer):
    """Serializer for batch translation requests"""
    texts = serializers.ListField(
        child=serializers.CharField(max_length=10000),
        max_length=100  # Limit batch size
    )
    target_language = serializers.CharField(max_length=10)
    source_language = serializers.CharField(max_length=10, required=False)


class VisionOCRSerializer(serializers.Serializer):
    """Serializer for Vision OCR requests"""
    image = serializers.ImageField()
    language_hints = serializers.ListField(
        child=serializers.CharField(max_length=10),
        required=False,
        max_length=10
    )


class GeocodeSerializer(serializers.Serializer):
    """Serializer for geocoding requests"""
    address = serializers.CharField(max_length=500)


class PlaceSearchSerializer(serializers.Serializer):
    """Serializer for place search requests"""
    query = serializers.CharField(max_length=500)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)
    radius = serializers.IntegerField(required=False, min_value=1, max_value=50000)
    type = serializers.CharField(max_length=50, required=False)