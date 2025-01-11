import React, { useState, useEffect } from 'react';
import { TouchableOpacity, SafeAreaView, ScrollView, View, Button, Image, StyleSheet, ActivityIndicator, Text, Alert, Modal, TextInput} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Card from './components/Cards'; // Adjust path based on your folder structure
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the refresh icon
import axios from 'axios';

export default function App() {
  const [image, setImage] = useState(null); // Image URI
  const [loading, setLoading] = useState(false); // Loading indicator
  const [response, setResponse] = useState(""); // API response
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility
  const [newPlantName, setNewPlantName] = useState(""); // New plant name
  const [crops, setcrops] = useState([
    {
      id: "1",
      plantname: "Tomato",
      status: "red",
      moisture: "20",
      humidity: "40",
      imageBase64: "",
    },
    {
      id: "2",
      plantname: "Beans",
      status: "green",
      moisture: "90",
      humidity: "30",
      imageBase64: "",
    },
    {
      id: "3",
      plantname: "Aloo",
      status: "yellow",
      moisture: "90",
      humidity: "210",
      imageBase64: "",
    },
    {
      id: "4",
      plantname: "Onion",
      status: "green",
      moisture: "204",
      humidity: "4056",
      imageBase64: "",
    },
  ]);

  const API_KEY = 'AIzaSyACziMbPJ71ZICOmOjWINRv_OnbprABtRQ'; // Replace with your Google API key
  const FOLDER_ID = '1mOb_z1-deBf1S-4eGjt7JHs-z0M2Alda'; // Replace with your folder ID
  const BASE_URL = 'https://www.googleapis.com/drive/v3/files';
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Start processing from the root folder
    setFiles([]);
    const loadFolderContents = async () => {
      await fetchFolderContents(FOLDER_ID);
    };
    loadFolderContents();
  }, []);

  const fetchFolderContents = async (parentFolderId) => {
    const url = `${BASE_URL}?q='${parentFolderId}'+in+parents&key=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.files) {
        const folderData = await Promise.all(
          data.files.map(async (folder) => {
            if (folder.mimeType === "application/vnd.google-apps.folder") {
              const innerFolderContents = await fetchInnerFolderContents(folder.id);
              return {
                name: folder.name,
                ...innerFolderContents,
              };
            }
          })
        );
  
        const filteredData = folderData.filter(Boolean); // Remove undefined entries
        setFiles((prevFiles) => [...prevFiles, ...filteredData]); // Update the state
      } else {
        console.error("No files found in the folder.");
      }
    } catch (error) {
      console.error("Error fetching folder contents:", error);
    }
  };
  
  const fetchInnerFolderContents = async (innerFolderId) => {
    const url = `${BASE_URL}?q='${innerFolderId}'+in+parents&key=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      let imageId = "";
      let humidity = "";
      let moisture = "";
  
      if (data.files) {
        for (const file of data.files) {
          if (file.mimeType.startsWith("image/")) {
            imageId = file.id;
          } else if (file.mimeType === "text/plain") {
            const fileContent = await fetchFileContent(file.id);
            const lines = fileContent.split("\n");
            humidity = lines[0] || ""; // First line
            moisture = lines[1] || ""; // Second line
          }
        }
      }
  
      return {
        image: imageId,
        humidity,
        moisture,
      };
    } catch (error) {
      console.error("Error fetching inner folder contents:", error);
      return {};
    }
  };
  
  const fetchFileContent = async (fileId) => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
    try {
      const response = await fetch(url);
  
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }
  
      const textContent = await response.text();
      return textContent;
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw error;
    }
  };
  

  const handleRefresh = () => {
    // Refresh logic
    Alert.alert('Refresh clicked!');
    setFiles([]);
    const loadFolderContents = async () => {
      await fetchFolderContents(FOLDER_ID);
    };
    loadFolderContents();
    // crops.map((item) => {
    //   //Call Sanjana's APi to get soil moisture, humidity etc of each plant

    //   // Sanjana's API will also get you an image of the particular crop. 
    //   //Send this image and get the PLant details from the identification APi 
    //   sendImageToAPI(item.imageBase64);
    // });
    // You can add any refresh logic you want here, like resetting state or fetching new data
  };


  const addNewPlant = () => {
    if (newPlantName.trim()) {
      const newPlant = {
        id: (crops.length + 1).toString(),
        plantname: newPlantName,
        status: "green",
        moisture: "0",
        humidity: "0"
      };
      setcrops([...crops, newPlant]);
      setModalVisible(false);
      setNewPlantName("");
    } else {
      Alert.alert("Error", "Plant name cannot be empty!");
    }
  };


  // Function to capture or pick an image
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      base64: true, // Base64 data
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); // Store image URI
      sendImageToAPI(result.assets[0].base64); // Send image as base64
      console.log(result.assets[0].base64);
    }
  };

  // Function to send the image to the API
  const sendImageToAPI = async (base64Image) => {
    setLoading(true); // Show loading indicator

    const myHeaders = new Headers();
    myHeaders.append("Api-Key", "I4SZQbNvaeV3CBrkD2eYeMQ7eq2tWOiI1rIIIjGRuWN72aRhef"); // Replace with your API key
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      latitude: 49.207,
      longitude: 16.608,
      images: [String(base64Image)], // Base64 image in request body
      similar_images: true,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    console.log(requestOptions);

    try {
      const response = await fetch("https://plant.id/api/v3/identification", requestOptions);
      const result = await response.json();
      result = {
        "access_token": "GIe6akEJKXSBebJ",
        "model_version": "plant_id:3.1.0",
        "custom_id": null,
        "input": {
          "latitude": 49.207,
          "longitude": 16.608,
          "similar_images": true,
          "images": [
            "http://plant.id/media/imgs/44681b0e7ed14fa7b086c53f6daec144.jpg"
          ],
          "datetime": "2023-07-10T06:37:48.133286+00:00"
        },
        "result": {
          "is_plant": {
            "probability": 0.47637302,
            "binary": false,
            "threshold": 0.5
          },
          "classification": {
            "suggestions": [
              {
                "id": "ae8faed4a61d9de2",
                "name": "Tomato",
                "probability": 0.9998723,
                "similar_images": [
                  {
                    "id": "587aeca4494253948c702d8356b4bebc2557a63d",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.jpg",
                    "license_name": "CC0",
                    "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                    "citation": "hen_ry",
                    "similarity": 0.683,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.small.jpg"
                  },
                  {
                    "id": "dffa4fc0912feefa1516df8c20c080286556269f",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.jpeg",
                    "similarity": 0.543,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.small.jpeg"
                  }
                ],
                "details": {
                  "language": "en",
                  "entity_id": "ae8faed4a61d9de2"
                }
              },
              {
                "id": "ae8faed4a61d9de2",
                "name": "weed1",
                "probability": 0.9998723,
                "similar_images": [
                  {
                    "id": "587aeca4494253948c702d8356b4bebc2557a63d",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.jpg",
                    "license_name": "CC0",
                    "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                    "citation": "hen_ry",
                    "similarity": 0.683,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.small.jpg"
                  },
                  {
                    "id": "dffa4fc0912feefa1516df8c20c080286556269f",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.jpeg",
                    "similarity": 0.543,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.small.jpeg"
                  }
                ],
                "details": {
                  "language": "en",
                  "entity_id": "ae8faed4a61d9de2"
                }
              },
              {
                "id": "ae8faed4a61d9de2",
                "name": "weed2",
                "probability": 0.9998723,
                "similar_images": [
                  {
                    "id": "587aeca4494253948c702d8356b4bebc2557a63d",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.jpg",
                    "license_name": "CC0",
                    "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                    "citation": "hen_ry",
                    "similarity": 0.683,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.small.jpg"
                  },
                  {
                    "id": "dffa4fc0912feefa1516df8c20c080286556269f",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.jpeg",
                    "similarity": 0.543,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.small.jpeg"
                  }
                ],
                "details": {
                  "language": "en",
                  "entity_id": "ae8faed4a61d9de2"
                }
              },
              {
                "id": "ae8faed4a61d9de2",
                "name": "weed3",
                "probability": 0.9998723,
                "similar_images": [
                  {
                    "id": "587aeca4494253948c702d8356b4bebc2557a63d",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.jpg",
                    "license_name": "CC0",
                    "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                    "citation": "hen_ry",
                    "similarity": 0.683,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/587/aeca4494253948c702d8356b4bebc2557a63d.small.jpg"
                  },
                  {
                    "id": "dffa4fc0912feefa1516df8c20c080286556269f",
                    "url": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.jpeg",
                    "similarity": 0.543,
                    "url_small": "https://plant-id.ams3.cdn.digitaloceanspaces.com/similar_images/3/dff/a4fc0912feefa1516df8c20c080286556269f.small.jpeg"
                  }
                ],
                "details": {
                  "language": "en",
                  "entity_id": "ae8faed4a61d9de2"
                }
              }
            ]
          }
        },
        "status": "COMPLETED",
        "sla_compliant_client": true,
        "sla_compliant_system": true,
        "created": 1688971068.133286,
        "completed": 1688971068.496495
      };
      const names = result.result.classification.suggestions.map(item => item.name);
      setResponse(names);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const handleCardPress = (id) => {
    crops.map((item) => {
      if (item.id === id) {
        Alert.alert('Card Clicked!', `You clicked on card with ID: ${item.plantname}`);
      }
    });
  };

  return (
    <View style={styles.container}>
         <View style={styles.header}>
          <Image
            source={require('./assets/logo.jpg')} // Path to your logo image in assets folder
            style={styles.logo} // Apply the styles for the logo
          />
        </View>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          
          {files.map((file, index) => (
            <TouchableOpacity key={index} onPress={() => handleCardPress(index)} style={[styles.card, { backgroundColor: "red" }]}>
            <Image source={{ uri: `${BASE_URL}/${file.image}?alt=media&key=${API_KEY}` }} style={styles.image} />
            <Text style={styles.title}>{file.name}</Text>
            <Text style={styles.description}>Moisture: {file.moisture || 'No content available'}</Text>
            <Text style={styles.description}>Humidity: {file.humidity || 'No content available'}</Text>      
            <Text style={styles.description}>Aye hello</Text>
            </TouchableOpacity>
          ))}
          
        

          <Button title="Capture Image" onPress={pickImage} />
          {image && <Image source={{ uri: image }} style={styles.image} />}
          {loading && <ActivityIndicator size="large" color="#0000ff" />}
          {response && <Text style={styles.response}>{JSON.stringify(response)}</Text>}
        </ScrollView>
      </SafeAreaView>

      {/* Refresh Button at top right */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Icon name="refresh" size={30} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.plusButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.plusText}>+</Text>
      </TouchableOpacity>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Plant</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Plant Name"
              value={newPlantName}
              onChangeText={setNewPlantName}
            />
            <Button title="Add" onPress={addNewPlant} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    aligncrops: 'center',
    padding: 20,
    width: '100%',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the logo
    alignItems: 'center',
    width: '100%',  // Full width
    height: 100,     // Full height of the header
    backgroundColor: '#fff', // Optional, background color
    paddingHorizontal: 20,   // Optional, padding on the sides
  },
  logo: {
    width: '100%',      // Fixed height (adjust as needed)
    resizeMode: 'contain',  // Scale image proportionally
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    position: 'absolute',
    top: 20,  // Adjusted to match the header height
    right: 40,  // Moves it to the right of the header
    padding: 10,
    backgroundColor: 'transparent',
    zIndex: 2,  // Ensure it stays above other content
  },
  plusButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    aligncrops: "center",
    backgroundColor: 'green',
  },
  plusText: {
    color: "white",
    textAlign: "center",
    fontSize: 30,
  },
  response: {
    marginTop: 10,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalView: {
    backgroundColor: 'teal',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,  // Optional: Set a max width to avoid stretching on large screens
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  modalTitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    paddingLeft: 10,
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'transparent',
    padding: 10,
  },
  closeText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: "100%" 
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  description: {
    fontSize: 14,
    color: '#00000',
  },
});

