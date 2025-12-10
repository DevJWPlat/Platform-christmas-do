// Helper function to get player profile image
// Import images - Vite will handle the paths correctly
import benImg from '../assets/images/ben.jpg'
import christianImg from '../assets/images/christian.jpg'
import jonnyImg from '../assets/images/jonny.jpg'
import joshImg from '../assets/images/josh.jpg'
import lydiaImg from '../assets/images/lydia.jpg'
import mattImg from '../assets/images/matt.jpg'
import neilImg from '../assets/images/neil.jpg'
import tomImg from '../assets/images/tom.jpg'

export const getPlayerImage = (playerName) => {
  if (!playerName) return null
  
  // Trim whitespace and convert to lowercase for matching
  const name = playerName.trim().toLowerCase()
  
  // Map player names to imported images
  const imageMap = {
    ben: benImg,
    christian: christianImg,
    jonny: jonnyImg,
    josh: joshImg,
    lydia: lydiaImg,
    matt: mattImg,
    neil: neilImg,
    tom: tomImg,
  }
  
  const image = imageMap[name]
  
  // Debug logging (remove in production if needed)
  if (!image && name) {
    console.log(`No image found for player name: "${playerName}" (normalized: "${name}")`)
  }
  
  return image || null
}

