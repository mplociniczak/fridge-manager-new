// app/screens/HomeScreen.js
import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Alert } from 'react-native';
import { useProducts } from '../../components/ProductsContext';
import { Ionicons } from '@expo/vector-icons';
import ProductItem from '../../components/ProductItem';

export default function HomeScreen({ navigation }) {
  const { products, hasDeletedProducts, undoDelete } = useProducts();

  const handleUndo = () => {
    const restoredName = undoDelete();
    if (restoredName) {
      Alert.alert(
        "Przywrócono produkt",
        `Produkt "${restoredName}" został przywrócony do listy.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductItem product={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
      {hasDeletedProducts && (
        <TouchableOpacity 
          style={styles.undoButton}
          onPress={handleUndo}
        >
          <Ionicons name="arrow-undo" size={20} color="white" />
          <Text style={styles.undoText}>Cofnij usunięcie</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Camera')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#f4511e',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  undoButton: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  undoText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  }
});