from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

User = get_user_model()

class GoogleTokenLoginView(APIView):
    permission_classes = []

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response({'error': 'No credential provided'}, status=400)
        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            email    = idinfo['email']
            name     = idinfo.get('name', '')
            user, _  = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': name,
                    'role': 'student',
                    'is_active': True,
                }
            )
            refresh = RefreshToken.for_user(user)
            return Response({
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id':        user.id,
                    'email':     user.email,
                    'full_name': user.full_name,
                    'role':      user.role,
                }
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
