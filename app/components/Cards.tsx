import React from 'react';
import { Text, StyleSheet, Image, TouchableOpacity  } from 'react-native';


// Define props for the Card component
interface CardProps {
  id: string; // Add an id prop
  title: string;
  description: string;
  imageUrl: string;
  backgroundColor?: string; 
  moisture: string;
  humidity: string;
  onPress: (id: string) => void;

}

// Functional Component
const Card: React.FC<CardProps> = ({ title, description, imageUrl, moisture,humidity, backgroundColor = '#FFFFFF', onPress, id}) => {
  return (
    <TouchableOpacity  onPress={() => onPress(id)} style={[styles.card, { backgroundColor }]}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>Moisture: {moisture}</Text>
      <Text style={styles.description}>Humidity: {humidity}</Text>      
      <Text style={styles.description}>{description}</Text>
      </TouchableOpacity>
  );
};

// Styles
const styles = StyleSheet.create({
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

export default Card;
