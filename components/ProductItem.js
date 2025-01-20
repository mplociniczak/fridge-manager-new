import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert,
  Animated,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useProducts } from './ProductsContext';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.13:3000/api'; 

export default function ProductItem({ product }) {
  const { removeProduct } = useProducts();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showDetails, setShowDetails] = useState(false);
  const [productDetails, setProductDetails] = useState(null);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/product/${product.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProductDetails(data);
        setShowDetails(true);
      } else {
        Alert.alert("Błąd", "Nie udało się pobrać szczegółów produktu");
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert("Błąd", "Problem z połączeniem");
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Usuń produkt",
      `Czy na pewno chcesz usunąć ${product.name}?`,
      [
        {
          text: "Anuluj",
          style: "cancel"
        },
        {
          text: "Usuń",
          onPress: () => handleDelete(),
          style: "destructive"
        }
      ]
    );
  };

  const handleDelete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      removeProduct(product.id);
    });
  };

  return (
    <>
      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            scale: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })
          }]
        }
      ]}>
        <TouchableOpacity 
          style={styles.contentContainer}
          onPress={fetchProductDetails}
        >
          {product.image && (
            <Image
              source={{ uri: product.image }}
              style={styles.image}
            />
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.date}>
              Dodano: {new Date(product.date).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showDetails}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDetails(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {productDetails && (
                  <>
                    <Text style={styles.modalTitle}>{productDetails.name}</Text>
                    <Text style={styles.modalText}>Kategoria: {productDetails.category}</Text>
                    {productDetails.expiration_date && (
                      <Text style={styles.modalText}>
                        Data ważności: {new Date(productDetails.expiration_date).toLocaleDateString()}
                      </Text>
                    )}
                    {/* Możesz dodać więcej informacji z bazy danych */}
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowDetails(false)}
                    >
                      <Text style={styles.closeButtonText}>Zamknij</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: 10,
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
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#f4511e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  }
});