# WebUI

Vanilla HTML/CSS/JavaScript frontend, extracted from the existing repository prototype.

Open `index.html` using a local web server for development. The current UI still uses browser localStorage; Firebase is **not yet connected**.

The planned Firebase migration will use `js/config/`, `js/services/`, and feature modules. Do not add private service-account credentials to this public repository.

GitHub Pages: deploy `WebUI/` using a GitHub Actions artifact workflow; Pages branch-source deployment does not directly select arbitrary subfolders.
