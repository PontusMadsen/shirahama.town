#!/bin/bash

read -p 'Enter the existing repository name: ' repo

if [[ -z "$repo" ]]; then
   printf '%s\n' "No input entered"
   exit 1
fi

cd ..
echo 'Cloning white-label-markup'
git clone git@bitbucket.org:bigsouth/white-label-markup.git "$repo"

echo "Moving into directory"
cd "$repo"

echo "Pulling the latest changes"
git pull

echo "Changing remote url"
git remote set-url origin git@bitbucket.org:bigsouth/"$repo".git

echo "Update readme"
echo "####Project $repo" > readme.md

echo "Commit changes"
git commit -a -m "Update readme"

echo "Update origin"
git push -f origin master

echo "Install dependencies"
npm install

echo "Done!"
