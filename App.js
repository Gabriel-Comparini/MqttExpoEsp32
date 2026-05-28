import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MQTTService from './src/services/mqttService';
import StatusModal from './src/components/StatusModal';
import LightControl from './src/components/LightControl';
import Gauges from './src/components/Gauges';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mqtt = new MQTTService();

export default function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isLightOn, setIsLightOn] = useState(false);
    const [temp, setTemp] = useState(0);
    const [hum, setHum] = useState(0);

    const mqttConfig = {
        host: process.env.EXPO_PUBLIC_MQTT_HOST,
        port: parseInt(process.env.EXPO_PUBLIC_MQTT_PORT),
        path: process.env.EXPO_PUBLIC_MQTT_PATH,
        user: process.env.EXPO_PUBLIC_MQTT_USER,
        pass: process.env.EXPO_PUBLIC_MQTT_PASS,
        clientId: 'RN_App_' + Math.random(),
    };

    const startConnection = () => {
        setShowError(false);
        mqtt.connect(mqttConfig, (topic, message) => {
            if (topic === 'casa/temp') setTemp(parseFloat(message));
            if (topic === 'casa/hum') setHum(parseFloat(message));
            if (topic === 'casa/luz') setIsLightOn(message === "1");
        }, () => {
            setIsConnected(true);
            mqtt.subscribe('casa/temp');
            mqtt.subscribe('casa/hum');
            mqtt.subscribe('casa/luz');
        }, (err) => {
            setIsConnected(false);
            setShowError(true);
        }
        );
    };

    const toggleLight = () => {
        const newState = isLightOn ? "0" : "1";
        mqtt.publish('casa/luz', newState);
    };

    useEffect(() => {
        async function init(){
            const asyncHum = await AsyncStorage.getItem("hum");
            const asyncTemp = await AsyncStorage.getItem("temp");
            const asyncLight = await AsyncStorage.getItem("light");
            
            startConnection();

            if (asyncHum !== null) setHum(parseFloat(asyncHum));
            if (asyncTemp !== null) setTemp(parseFloat(asyncTemp));
            if (asyncLight !== null) setIsLightOn(asyncLight === "true");
        }

        init();
    }, []);

    useEffect(() => {
        async function init() {
            await AsyncStorage.setItem("hum", String(hum));
            await AsyncStorage.setItem("temp", String(temp));
            await AsyncStorage.setItem("light", String(isLightOn));
        }

        init();
    }, [hum, temp, isLightOn]);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Smart Home IoT</Text>

            <LightControl isLightOn={isLightOn} onToggle={toggleLight} />

            <Gauges temp={temp} hum={hum} />

            <StatusModal
                visible={showError}
                onRetry={startConnection}
                onLater={() => setShowError(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#121212',
        padding: 20, 
        alignItems: 'center'
    },

    header: { 
        color: '#FFF', 
        fontSize: 24,
        fontWeight: 'bold', 
        marginTop: 40,
        marginBottom: 20
    },
});