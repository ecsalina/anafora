import os, sys

if '/home/anafora/anafora-1.0.0/src/main' not in sys.path:
        sys.path.append('/home/anafora/anafora-1.0.0/src/main')

os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
