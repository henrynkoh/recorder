#!/bin/bash

# Update the index.html file to include the manifest link

# Find the head tag in the index.html file
sed -i'' -e 's/<head>/<head>\n<link rel="manifest" href="\/manifest.json">/' out/index.html
sed -i'' -e 's/<head>/<head>\n<meta name="theme-color" content="#FF3B30">/' out/index.html

echo "Updated index.html to include the manifest link for PWA support." 