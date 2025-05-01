import React from 'react'
import { FIREBASE_AUTH } from '../../FirebaseConfig'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword} from 'firebase/auth'
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Button, KeyboardAvoidingView } from 'react-native'

const styles = StyleSheet.create({
  container: {
    marginHorizontal : 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
})

const Login = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const auth = FIREBASE_AUTH

  const SignIn = async () => {
    setLoading(true)
    try {
      if (!email || !password) {
        // Checks to ensure both fields are entered
        alert('Please enter both email and password');
        setLoading(false);
        return;
      }
      const response = await signInWithEmailAndPassword(auth, email, password)
      console.log(response)
      alert('Login successful. Please check your email for further instructions.')
    } catch (error: any) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const SignUp = async () => {
    setLoading(true)
    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      console.log(user);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" >
      <TextInput value={email} style={styles.input} placeholder="Email" autoCapitalize="none" onChangeText={(text)=> setEmail(text)}></TextInput>
      <TextInput secureTextEntry={true} value={password} style={styles.input} placeholder="password" autoCapitalize="none" onChangeText={(text)=> setPassword(text)}></TextInput>
    { loading ? (<ActivityIndicator size="large" color="#0000ff" />)
    : (
      <>
        <Button title="Login" onPress={SignIn} />
        <Button title="Create Account" onPress={SignUp} />
      </>
    )}
    </KeyboardAvoidingView>
    </View>
  );
};

export default Login