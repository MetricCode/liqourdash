// app/services/cartService.ts with fixed ID generation
import { FIREBASE_DB, FIREBASE_AUTH } from '../../FirebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export const addToCart = async (product: any) => {
  try {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
    const cartSnap = await getDoc(cartRef);

    // Generate a unique ID for the cart item using timestamp and random number
    const uniqueId = `${product.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    const cartItem = {
      id: uniqueId, // Use the unique ID here
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      category: product.category,
      addedAt: new Date()
    };

    if (cartSnap.exists()) {
      // Update existing cart
      await updateDoc(cartRef, {
        items: arrayUnion(cartItem),
        updatedAt: new Date()
      });
    } else {
      // Create new cart
      await setDoc(cartRef, {
        userId: currentUser.uid,
        items: [cartItem],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};