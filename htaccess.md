# Prevent directory listing
Options -Indexes

# Set default index
DirectoryIndex index.html

# Redirect to HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Cache assets
<FilesMatch "\.(ico|jpg|jpeg|png|gif|css|js|woff2?)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
