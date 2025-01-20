import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useProducts } from '../../components/ProductsContext';

const ML_MODEL_URL = 'http://192.168.x.x:5000/detect'; // URL do modelu ML
const API_URL = 'http://192.168.1.13:3000/api'; // URL do API z bazą danych

export default function CameraScreen({ navigation }) {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductInfo, setShowProductInfo] = useState(false);
  const cameraRef = useRef(null);
  const { addProduct } = useProducts();

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Potrzebujemy dostępu do kamery
        </Text>
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

      // Zrobienie zdjęcia
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      // Przygotowanie danych do wysłania
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'frame.jpg'
      });

      // Wysłanie klatki do modelu ML
      const response = await fetch(ML_MODEL_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Odebranie koordynatów produktów
      const detections = await response.json();
      setDetectedProducts(detections);

    } catch (error) {
      console.error('Error sending frame to model:', error);
      Alert.alert(
        "Błąd",
        "Wystąpił problem podczas rozpoznawania produktów"
      );
      setDetectedProducts([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBoxPress = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/product/${productId}`);
      const productData = await response.json();
      
      if (response.ok) {
        setSelectedProduct(productData);
        setShowProductInfo(true);
      } else {
        Alert.alert("Błąd", "Nie udało się pobrać informacji o produkcie");
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert("Błąd", "Problem z połączeniem");
    }
  };

  const addToFridge = () => {
    if (selectedProduct) {
      addProduct({
        id: selectedProduct.id.toString(),
        name: selectedProduct.name,
        category: selectedProduct.category,
        date: new Date().toISOString(),
        expirationDate: selectedProduct.expiration_date
      });
      setShowProductInfo(false);
      setSelectedProduct(null);
      Alert.alert("Sukces", "Produkt został dodany do lodówki");
    }
  };

  const toggleCameraFacing = () => {
    setFacing(facing === 'back' ? 'front' : 'back');
  };

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        {detectedProducts.map((product, index) => {
          const boxStyle = {
            position: 'absolute',
            left: product.bottomLeft.x,
            top: product.topRight.y,
            width: product.topRight.x - product.bottomLeft.x,
            height: product.bottomLeft.y - product.topRight.y,
            borderWidth: 2,
            borderColor: '#DC143C',
            backgroundColor: 'transparent'
          };

          return (
            <TouchableOpacity
              key={index}
              style={boxStyle}
              onPress={() => handleBoxPress(product.id)}
            />
          );
        })}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isProcessing && styles.buttonDisabled]}
            onPress={sendFrameToModel}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.text}>Rozpoznaj produkty</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Text style={styles.text}>Odwróć</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      <Modal
        visible={showProductInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProductInfo(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowProductInfo(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedProduct && (
                  <>
                    <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                    <Text style={styles.modalText}>
                      Kategoria: {selectedProduct.category}
                    </Text>
                    {selectedProduct.expiration_date && (
                      <Text style={styles.modalText}>
                        Data ważności: {new Date(selectedProduct.expiration_date).toLocaleDateString()}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={addToFridge}
                    >
                      <Text style={styles.addButtonText}>Dodaj do lodówki</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'center',
    minWidth: 100,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  flipButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'center',
    minWidth: 80,
  },
  text: {
    fontSize: 18,
    color: 'black',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#f4511e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  }
});