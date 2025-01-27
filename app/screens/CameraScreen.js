import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useProducts } from '../../components/ProductsContext';

const ML_MODEL_URL = 'http://192.168.0.94:5000/video_feed'; // URL do serwera Flask

export default function CameraScreen({ navigation }) {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState([]);
  const cameraRef = useRef(null);
  const { addProduct } = useProducts();

  useEffect(() => {
    if (permission?.granted) {
      const interval = setInterval(() => {
        sendFrameToModel();
      }, 3000); // Co 3 sekundy

      return () => clearInterval(interval);
    }
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Potrzebujemy dostępu do kamery</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={requestPermission}
        >
          <Text style={styles.text}>Przyznaj dostęp</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sendFrameToModel = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setDetectedProducts([]);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: true,
      });

      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'frame.jpg',
      });

      const response = await fetch(ML_MODEL_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Błąd sieci');
      }

      const data = await response.json();
      console.log("Odpowiedź serwera:", JSON.stringify(data, null, 2));

      if (!Array.isArray(data)) {
        throw new Error('Niepoprawny format odpowiedzi');
      }

      setDetectedProducts(data);
    } catch (error) {
      console.error('Błąd przy wysyłaniu klatki:', error);
      Alert.alert("Błąd", `Problem z przetwarzaniem obrazu: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBoxPress = (index) => {
    const selectedProduct = detectedProducts[index];
    addProduct({
      id: `${selectedProduct.topLeft.x}-${selectedProduct.topLeft.y}`,
      name: selectedProduct.label,
      category: 'Nieznana',
      date: new Date().toISOString(),
      expirationDate: null,
    });

    Alert.alert("Sukces", `Dodano produkt ${selectedProduct.label} do listy!`);
  };

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        {detectedProducts.length > 0 && console.log("Wykryte obiekty:", detectedProducts)}

        {detectedProducts.map((product, index) => {
          console.log(`Współrzędne ${index}:`, product);

          const boxStyle = {
            position: 'absolute',
            left: product.topLeft.x || 0,
            top: product.topLeft.y || 0,
            width: (product.bottomRight.x || 0) - (product.topLeft.x || 0),
            height: (product.bottomRight.y || 0) - (product.topLeft.y || 0),
            borderWidth: 2,
            borderColor: 'red',
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
          };

          return (
            <TouchableOpacity
              key={index}
              style={boxStyle}
              onPress={() => handleBoxPress(index)}
            />
          );
        })}
      </CameraView>

      <View style={styles.buttonContainer}>
        {isProcessing ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Text style={styles.text}>Wykrywanie obiektów...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  }
});
