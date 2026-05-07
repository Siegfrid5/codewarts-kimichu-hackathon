/**
 * GABAYANI — Education Videos Seeder
 * 
 * This script seeds the education_videos table with 100 farming educational videos
 * from the Philippines. Run this after running migrations to populate the database.
 */

const knex = require('../db');
const EducationVideo = require('../models/EducationVideo');

const educationVideosData = [
  // Rice and Corn Production (Grains)
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Rice Farming: Complete Guide from Seeds to Harvest',
    description: 'Complete guide to rice farming from seed selection to harvest techniques.',
    duration: '25:30',
    category: 'Rice and Corn',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: '6 Expert Tips para Tumaas ang Ani sa Palay',
    description: 'Six expert tips to increase rice yield in the Philippines.',
    duration: '18:45',
    category: 'Rice and Corn',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Fertilizer Application for Rice (Pagsusuwi at Paglilihi)',
    description: 'Proper fertilizer application techniques for rice crops.',
    duration: '15:20',
    category: 'Rice and Corn',
    channel: 'AGRICULTURIST'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: '2022 Guide for Rice Production (Land Prep to Harvest)',
    description: 'Complete rice production guide from land preparation to harvest.',
    duration: '32:10',
    category: 'Rice and Corn',
    channel: 'AGRI-CROPS DOC'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Iwasan ang 30% Lugi sa Ani (Thailand Rice Guide)',
    description: 'How to avoid 30% loss in rice harvest using Thailand rice farming techniques.',
    duration: '22:15',
    category: 'Rice and Corn',
    channel: 'DDT Nature Farm'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Corn Farming: Complete Guide from Seeds to Harvest',
    description: 'Complete guide to corn farming from seeds to harvest.',
    duration: '28:40',
    category: 'Rice and Corn',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Practical Tips for Successful Corn Farming',
    description: 'Practical tips for successful corn farming in the Philippines.',
    duration: '19:30',
    category: 'Rice and Corn',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Tips at Paraan sa Pagtatanim ng Mais',
    description: 'Tips and methods for planting corn effectively.',
    duration: '16:50',
    category: 'Rice and Corn',
    channel: 'Agri Kaalaman'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Hybrid Corn Fertilizer Application (Syngenta NK6130)',
    description: 'Fertilizer application for hybrid corn Syngenta NK6130.',
    duration: '14:25',
    category: 'Rice and Corn',
    channel: 'AgriChannel'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Rice Infographics: From Breeding to Plate',
    description: 'Understanding rice production from breeding to consumption.',
    duration: '12:40',
    category: 'Rice and Corn',
    channel: 'PhilRiceTV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Direct Seeding vs. Transplanting Guide',
    description: 'Comparison between direct seeding and transplanting methods.',
    duration: '17:55',
    category: 'Rice and Corn',
    channel: 'PhilRiceTV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Modern Harvesting Equipment in PH Rice Fields',
    description: 'Modern harvesting equipment used in Philippine rice fields.',
    duration: '20:30',
    category: 'Rice and Corn',
    channel: 'Agri-Vlogs'
  },
  // Livestock: Poultry and Duck Raising
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Free-Range Chicken Farming (Full Version)',
    description: 'Complete guide to free-range chicken farming.',
    duration: '35:20',
    category: 'Poultry and Duck',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Egg-cellent Business: Poultry Farm Negosyo Guide',
    description: 'Business guide for poultry farming and egg production.',
    duration: '28:15',
    category: 'Poultry and Duck',
    channel: 'Chinkee Tan'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Layer Chicken: Beginner\'s Guide (Mga dapat alamin)',
    description: 'Beginner\'s guide to layer chicken farming.',
    duration: '22:40',
    category: 'Poultry and Duck',
    channel: 'Sea_Rino'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'How to Start Free Range Chicken Farming (Data Analyst Story)',
    description: 'Success story of starting free-range chicken farming.',
    duration: '25:10',
    category: 'Poultry and Duck',
    channel: 'Agree sa Agri'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Egg Business Capital for 200 Heads RTL Chicken',
    description: 'Capital requirements for egg business with 200 RTL chickens.',
    duration: '18:30',
    category: 'Poultry and Duck',
    channel: 'Cha Gomez'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Duck Raising Seminar: How to Succeed in Duck Raising',
    description: 'Seminar on successful duck raising techniques.',
    duration: '32:45',
    category: 'Poultry and Duck',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Kaya Kumita 150K A Month sa Itik Farming?',
    description: 'Can you earn 150K a month from duck farming?',
    duration: '24:20',
    category: 'Poultry and Duck',
    channel: 'Farming Business Atbp'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Guide Sa Pag Aalaga Ng Ducklings (Lapag Brooder)',
    description: 'Guide to raising ducklings in brooder.',
    duration: '19:50',
    category: 'Poultry and Duck',
    channel: 'Ka DuGSiNG'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Income from 100 Heads of Itik (Duck)',
    description: 'Income potential from 100 ducks.',
    duration: '16:35',
    category: 'Poultry and Duck',
    channel: 'Engr. Agri'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Free Range Chicken Production Part 1',
    description: 'Free range chicken production techniques part 1.',
    duration: '27:40',
    category: 'Poultry and Duck',
    channel: 'ATI Calabarzon'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Free Range Chicken Production Part 2',
    description: 'Free range chicken production techniques part 2.',
    duration: '29:15',
    category: 'Poultry and Duck',
    channel: 'ATI Calabarzon'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Backyard Native Chicken Raising Tips',
    description: 'Tips for raising native chickens in backyard.',
    duration: '21:30',
    category: 'Poultry and Duck',
    channel: 'Pinoy Farmer'
  },
  // Livestock: Swine, Goat, and Cattle Raising
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'How To Start a Piggery Business (Beginners Guide)',
    description: 'Beginner\'s guide to starting a piggery business.',
    duration: '33:20',
    category: 'Swine, Goat, and Cattle',
    channel: '6102Vids'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Puhunan at Kita sa Pag-aalaga ng 20 Fattener Pigs',
    description: 'Capital and income from raising 20 fattener pigs.',
    duration: '26:45',
    category: 'Swine, Goat, and Cattle',
    channel: 'Farmville Valley'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: '5 Tips Paano Magsimula ng Babuyan sa Isang Inahin',
    description: '5 tips to start a piggery with one sow.',
    duration: '23:10',
    category: 'Swine, Goat, and Cattle',
    channel: 'ABM_Arnel Manalo TV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'How Profitable is Pig Farming in the Philippines?',
    description: 'Profitability analysis of pig farming in the Philippines.',
    duration: '28:30',
    category: 'Swine, Goat, and Cattle',
    channel: 'AGRIBUZZ'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Goat Farming (Full Version Guide)',
    description: 'Complete guide to goat farming.',
    duration: '31:15',
    category: 'Swine, Goat, and Cattle',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Kaalaman Sa Pag-aalaga ng Kambing Para Hindi Mamatayan',
    description: 'Knowledge on goat raising to prevent mortality.',
    duration: '24:50',
    category: 'Swine, Goat, and Cattle',
    channel: 'SAYDLINE.PH'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: '21-Year-Old Entrepreneur\'s Lucrative Goat Farm',
    description: 'Success story of a 21-year-old goat farmer.',
    duration: '27:25',
    category: 'Swine, Goat, and Cattle',
    channel: 'OG'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Cattle Farming in the Philippines Part 1',
    description: 'Cattle farming in the Philippines part 1.',
    duration: '35:40',
    category: 'Swine, Goat, and Cattle',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Sorghum Farming To Boost Cattle Production',
    description: 'Sorghum farming to boost cattle production.',
    duration: '22:30',
    category: 'Swine, Goat, and Cattle',
    channel: 'Emmanuel Piñol'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Feeding Management for Fattening Cattle',
    description: 'Feeding management for fattening cattle.',
    duration: '19:45',
    category: 'Swine, Goat, and Cattle',
    channel: 'DA-RFO'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pig Farming Success: Resigning for Livestock',
    description: 'Success story of leaving corporate for pig farming.',
    duration: '30:20',
    category: 'Swine, Goat, and Cattle',
    channel: 'Agree sa Agri'
  },
  // Vegetable Farming (Highland and Lowland)
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Kikita ng 150K sa 1,250 SQM (Cabbage Farming)',
    description: 'Earn 150K from 1,250 SQM cabbage farming.',
    duration: '26:35',
    category: 'Vegetable Farming',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Paano Mapataas ang Bunga ng Kamatis?',
    description: 'How to increase tomato yield.',
    duration: '21:15',
    category: 'Vegetable Farming',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Kitaan sa Siling Labuyo (3000 Plants Guide)',
    description: 'Income from 3000 chili pepper plants.',
    duration: '24:40',
    category: 'Vegetable Farming',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pagtanim at Paramihin ang Bunga ng Talong sa Container',
    description: 'Planting and multiplying eggplant in containers.',
    duration: '18:50',
    category: 'Vegetable Farming',
    channel: 'Pinoy Urban Gardener'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Chinese Pechay Farming for High Profit',
    description: 'High-profit Chinese pechay farming.',
    duration: '22:25',
    category: 'Vegetable Farming',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pruning Eggplant for High Yields',
    description: 'Pruning techniques for high eggplant yields.',
    duration: '17:30',
    category: 'Vegetable Farming',
    channel: 'Happy Farm'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Bell Pepper Farming Guide (Lowland Philippines)',
    description: 'Bell pepper farming guide for lowland Philippines.',
    duration: '28:10',
    category: 'Vegetable Farming',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Okra Farming: Planting to Harvest Tips',
    description: 'Okra farming from planting to harvest.',
    duration: '19:55',
    category: 'Vegetable Farming',
    channel: 'Agri Kaalaman'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Ampalaya (Bitter Melon) Farming Success Story',
    description: 'Success story of ampalaya farming.',
    duration: '25:40',
    category: 'Vegetable Farming',
    channel: 'Agripreneur'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'String Beans (Sitaw) Commercial Farming',
    description: 'Commercial string beans farming guide.',
    duration: '23:20',
    category: 'Vegetable Farming',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Cucumber Farming: Vertical Trellis System',
    description: 'Cucumber farming with vertical trellis system.',
    duration: '20:45',
    category: 'Vegetable Farming',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Onion Farming in Bongabon: Seedling to Harvest',
    description: 'Onion farming in Bongabon from seedling to harvest.',
    duration: '32:30',
    category: 'Vegetable Farming',
    channel: 'Agribusiness Philippines'
  },
  // Fruit Trees and High-Value Crops
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Mango Farming: Solution para Kumita ang Farmers',
    description: 'Solutions for profitable mango farming.',
    duration: '34:20',
    category: 'Fruit Trees',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Mango Flower Induction: Paano Magpabunga?',
    description: 'How to induce mango flowering.',
    duration: '21:50',
    category: 'Fruit Trees',
    channel: 'agrifutureTV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'How to Start a Cacao Farm',
    description: 'Guide to starting a cacao farm.',
    duration: '29:15',
    category: 'Fruit Trees',
    channel: 'Cacao Culture - Philippines'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Gabay sa Pagtatanim ng Cacao',
    description: 'Guide to planting cacao.',
    duration: '25:40',
    category: 'Fruit Trees',
    channel: 'Agree sa Agri'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Paano Mag-Alaga ng Lakatan na Saging (200 Crates/week)',
    description: 'How to raise Lakatan bananas (200 crates/week).',
    duration: '27:30',
    category: 'Fruit Trees',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Lakatan Banana Planting Distance and Guide',
    description: 'Lakatan banana planting distance and guide.',
    duration: '22:15',
    category: 'Fruit Trees',
    channel: 'Nodgie TV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Coconut Farming: Increasing Coconut Harvest',
    description: 'Techniques to increase coconut harvest.',
    duration: '30:45',
    category: 'Fruit Trees',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Coconut Fertilization Program Using Salt',
    description: 'Coconut fertilization program using salt.',
    duration: '24:10',
    category: 'Fruit Trees',
    channel: 'agrifutureTV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Paano Magtanim ng Dragon Fruit?',
    description: 'How to plant dragon fruit.',
    duration: '26:35',
    category: 'Fruit Trees',
    channel: 'Reyes Atipen Farm'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Dragon Fruit Farming Part 1: Beginner Tips',
    description: 'Dragon fruit farming beginner tips part 1.',
    duration: '28:20',
    category: 'Fruit Trees',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Puhunan sa Unang Taon ng Calamansi Farm',
    description: 'Capital for first year of calamansi farming.',
    duration: '23:45',
    category: 'Fruit Trees',
    channel: 'WORK FROM FARM PH'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Tamang Gabay sa Kalamansi Farming',
    description: 'Proper guide to calamansi farming.',
    duration: '21:30',
    category: 'Fruit Trees',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Coffee Farming in Bukidnon: Iraya Coffee Farm',
    description: 'Coffee farming in Bukidnon at Iraya Coffee Farm.',
    duration: '32:15',
    category: 'Fruit Trees',
    channel: 'ATI NORTHMIN'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: '4 Diskarte para Dumami ang Bunga ng Kape',
    description: '4 strategies to increase coffee yield.',
    duration: '19:50',
    category: 'Fruit Trees',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Papaya Farming (Red Lady Variety) Success',
    description: 'Success story of Red Lady papaya farming.',
    duration: '24:40',
    category: 'Fruit Trees',
    channel: 'Agripreneur'
  },
  // Fisheries and Aquaculture
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Sustainable Tilapia Farming in the Philippines',
    description: 'Sustainable tilapia farming practices.',
    duration: '27:25',
    category: 'Fisheries and Aquaculture',
    channel: 'Happy Farmer'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Basic Tips Para Kumita ng Doble sa Tilapia Farming',
    description: 'Basic tips to double income from tilapia farming.',
    duration: '22:10',
    category: 'Fisheries and Aquaculture',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Tilapia Biofloc Technology for Young Agripreneurs',
    description: 'Tilapia biofloc technology for young farmers.',
    duration: '25:50',
    category: 'Fisheries and Aquaculture',
    channel: 'RAYMELTV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Paano Mag-alaga ng Hito (Catfish) sa Concrete Pond',
    description: 'How to raise catfish in concrete pond.',
    duration: '23:35',
    category: 'Fisheries and Aquaculture',
    channel: 'AgriBusy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Limang Dapat Tandaan Bago Mag Start sa Hito Business',
    description: '5 things to remember before starting catfish business.',
    duration: '19:20',
    category: 'Fisheries and Aquaculture',
    channel: 'KabsFarmingTV'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Catfish Farming in IBC Tanks/Drums',
    description: 'Catfish farming in IBC tanks and drums.',
    duration: '26:45',
    category: 'Fisheries and Aquaculture',
    channel: 'AgriBusy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Indoor Shrimp Biofloc Technology: Salinity Prep',
    description: 'Indoor shrimp biofloc technology salinity preparation.',
    duration: '28:30',
    category: 'Fisheries and Aquaculture',
    channel: 'Pinoy Palaboy'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Successful Bangus (Milkfish) Cage Farming',
    description: 'Successful milkfish cage farming.',
    duration: '31:15',
    category: 'Fisheries and Aquaculture',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Mud Crab (Alimango) Fattening in Bataan',
    description: 'Mud crab fattening in Bataan.',
    duration: '24:40',
    category: 'Fisheries and Aquaculture',
    channel: 'Agripreneur'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pangasius Farming: Breeding and Production',
    description: 'Pangasius farming breeding and production.',
    duration: '29:25',
    category: 'Fisheries and Aquaculture',
    channel: 'DA-BFAR'
  },
  // Organic and Sustainable Farming
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pag-gawa ng FPJ, FFJ at FAA (3 Basic Concoctions)',
    description: 'Making FPJ, FFJ, and FAA - 3 basic organic concoctions.',
    duration: '22:35',
    category: 'Organic Farming',
    channel: 'The Agrillenial'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Complete Tutorial: 3 Organic Fertilizers',
    description: 'Complete tutorial on 3 organic fertilizers.',
    duration: '25:10',
    category: 'Organic Farming',
    channel: 'Don Bustamante Rooftop'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'How to Make OHN, CALPHOS, and Vermitea',
    description: 'How to make OHN, CALPHOS, and Vermitea.',
    duration: '27:45',
    category: 'Organic Farming',
    channel: 'Happy Farmer'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'SOA on Organic Agriculture: Producing Vegetables',
    description: 'School on the air for organic vegetable production.',
    duration: '30:20',
    category: 'Organic Farming',
    channel: 'ATI Bicol Channel'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Vermi-composting: Turning Waste to Gold',
    description: 'Vermi-composting turning waste to fertilizer.',
    duration: '24:55',
    category: 'Organic Farming',
    channel: 'Agribusiness Philippines'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Natural Pesticide: 2 Ingredient Growth Enhancer',
    description: 'Natural pesticide with 2 ingredient growth enhancer.',
    duration: '18:30',
    category: 'Organic Farming',
    channel: 'Sprout Up Philippines'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Indigenous Microorganisms (IMO) Preparation',
    description: 'Preparation of indigenous microorganisms.',
    duration: '21:40',
    category: 'Organic Farming',
    channel: 'Agri-Vlogs'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Mushroom Farming: Beginner\'s Guide to Oyster Mushroom',
    description: 'Beginner\'s guide to oyster mushroom farming.',
    duration: '26:15',
    category: 'Organic Farming',
    channel: 'What the Farm'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Successful Oyster Mushroom: 100K Monthly Income',
    description: 'Success story of 100K monthly income from oyster mushroom.',
    duration: '23:50',
    category: 'Organic Farming',
    channel: 'KAFARMERS'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Organic Pig Farming (Korean Natural Farming)',
    description: 'Organic pig farming using Korean natural farming methods.',
    duration: '28:25',
    category: 'Organic Farming',
    channel: 'Agribusiness Philippines'
  },
  // Hydroponics, Urban Farming, and Modern Tech
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Learn Hydroponics Farming with P500 Capital',
    description: 'Learn hydroponics farming with only P500 capital.',
    duration: '19:35',
    category: 'Modern Farming',
    channel: 'OG'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Hydroponics Lettuce: Negosyo sa Harap ng Bahay',
    description: 'Hydroponics lettuce business in front of house.',
    duration: '22:10',
    category: 'Modern Farming',
    channel: 'UNTV News'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Puhunan at Income sa Hydroponics (Kratky Method)',
    description: 'Capital and income in hydroponics using Kratky method.',
    duration: '24:45',
    category: 'Modern Farming',
    channel: 'Backyard Pharming'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Vertical Farming DIY: Mini Farm Tutorial',
    description: 'DIY vertical farming mini farm tutorial.',
    duration: '27:20',
    category: 'Modern Farming',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pagtanim ng Lettuce sa Bote ng Softdrinks',
    description: 'Planting lettuce in softdrink bottles.',
    duration: '16:50',
    category: 'Modern Farming',
    channel: 'Pinoy Urban Gardener'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Aquaponics System: Fish and Vegetables Together',
    description: 'Aquaponics system combining fish and vegetables.',
    duration: '29:40',
    category: 'Modern Farming',
    channel: 'Agribusiness Philippines'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Hydroponics Tomato Farming in Greenhouse',
    description: 'Hydroponics tomato farming in greenhouse.',
    duration: '32:15',
    category: 'Modern Farming',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Smart Farming: Solar Power Irrigation Systems',
    description: 'Smart farming with solar power irrigation systems.',
    duration: '25:30',
    category: 'Modern Farming',
    channel: 'DA-Region 3'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Drip Irrigation Installation for Small Farms',
    description: 'Drip irrigation installation for small farms.',
    duration: '21:55',
    category: 'Modern Farming',
    channel: 'Pinoy Farmer'
  },
  // Agribusiness Management, Loans, and Success Stories
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Top 15 Most Profitable Farming Business in PH',
    description: 'Top 15 most profitable farming businesses in Philippines.',
    duration: '28:20',
    category: 'Agribusiness',
    channel: 'Profitable Agribusiness'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pautang na Walang Interest: ACPC Loan Guide',
    description: 'Interest-free loan guide from ACPC.',
    duration: '23:45',
    category: 'Agribusiness',
    channel: 'AgriKaalaman'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'DA-ACPC Online Sign-up for Credit Programs',
    description: 'Online sign-up for DA-ACPC credit programs.',
    duration: '19:30',
    category: 'Agribusiness',
    channel: 'DA-ACPC PH'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Financial Literacy for Farmers and Fisherfolk',
    description: 'Financial literacy training for farmers and fisherfolk.',
    duration: '31:10',
    category: 'Agribusiness',
    channel: 'DA-ACPC PH'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'OFW Successful Retirement Home and Agri-Business',
    description: 'OFW success story: retirement home and agri-business.',
    duration: '34:25',
    category: 'Agribusiness',
    channel: 'Agree sa Agri'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Jeepney Driver to Successful Integrated Farmer',
    description: 'Success story from jeepney driver to integrated farmer.',
    duration: '29:50',
    category: 'Agribusiness',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'Piloto at Stewardess, Magsasaka na Ngayon',
    description: 'Pilot and stewardess turned farmers.',
    duration: '27:35',
    category: 'Agribusiness',
    channel: 'Agree sa Agri'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: 'I.T. Expert Successful in Cacao Farming',
    description: 'IT expert success story in cacao farming.',
    duration: '32:40',
    category: 'Agribusiness',
    channel: 'Agribusiness How It Works'
  },
  {
    video_id: 'dQw4w9WgXcQ',
    title: '5 Things to Remember Before Starting a Farm',
    description: '5 important things to remember before starting a farm.',
    duration: '22:15',
    category: 'Agribusiness',
    channel: 'Agribusiness How It Works'
  }
];

async function seedEducationVideos() {
  try {
    console.log('🎬 Starting education videos seeder...');
    
    // Clear existing videos
    console.log('�️  Clearing existing education videos...');
    await knex('education_videos').del();
    console.log('✅ Cleared existing videos');
    
    // Generate unique video_ids for each video
    const videosWithUniqueIds = educationVideosData.map((video, index) => ({
      ...video,
      video_id: `edu_vid_${String(index + 1).padStart(3, '0')}`
    }));
    
    console.log(`📝 Inserting ${videosWithUniqueIds.length} videos...`);
    
    const insertedVideos = await EducationVideo.bulkInsert(videosWithUniqueIds);
    
    console.log(`✅ Successfully inserted ${insertedVideos.length} videos`);
    console.log('\n📊 Videos by category:');
    
    const categoryCounts = {};
    educationVideosData.forEach(video => {
      categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} videos`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding education videos:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedEducationVideos();
}

module.exports = { seedEducationVideos, educationVideosData };
