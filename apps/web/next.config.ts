import type { NextConfig } from "next";
import fs from 'fs'
import path from 'path'

function generateImageList() {
  const dir = path.join(process.cwd(), 'public/images/gallery')
  const files = fs.readdirSync(dir)
  const imagePaths = files
    .filter(file => /\.(png|jpe?g|webp|gif)$/i.test(file))
    .map(file => `/images/gallery/${file}`)

  fs.writeFileSync(
    path.join(process.cwd(), 'src/data/imageList.json'),
    JSON.stringify(imagePaths, null, 2)
  )

  console.log("Generated image list with", imagePaths.length, "images.")
}

generateImageList()

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['cdn.wynncraft.com', 'mc-heads.net', 'vzge.me'],
  },
};

export default nextConfig;
