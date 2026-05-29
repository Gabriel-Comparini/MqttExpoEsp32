import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, FlatList } from 'react-native';
import MQTTService from './src/services/mqttService';
import StatusModal from './src/components/StatusModal';
import LightControl from './src/components/LightControl';
import Gauges from './src/components/Gauges';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteData, initDatabase, insertNewData, selectData } from './src/services/db';

const mqtt = new MQTTService();

export default function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [showError, setShowError] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [isLightOn, setIsLightOn] = useState(false);
    const [temp, setTemp] = useState(0);
    const [hum, setHum] = useState(0);
    const [data, setData] = useState([]);

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
            await initDatabase();
            setData(await selectData());

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
            await insertNewData(hum, temp, isLightOn);
            setData(await selectData());
        }

        init();
    }, [hum, temp, isLightOn]);

    return (
        <View style={styles.screen}>
            {!historyVisible ? (
                <View style={styles.container}>
                    <Text style={styles.header}>Smart Home IoT</Text>

                    <LightControl isLightOn={isLightOn} onToggle={toggleLight} />

                    <Gauges temp={temp} hum={hum} />

                    <StatusModal
                        visible={showError}
                        onRetry={startConnection}
                        onLater={() => setShowError(false)}
                    />

                    <Pressable style={styles.histBtn} onPress={() => setHistoryVisible(!historyVisible)}>
                        <Text style={styles.btnText}>
                            Visualizar histórico
                        </Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.container}>
                    <FlatList 
                        data={data}
                        style={styles.list}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item })=>
                            <View style={styles.item}>
                                <Text style={{color: "#F1C40F"}}>
                                    Luz: {item.light ? "ligada" : "desligada"}
                                </Text>
                                <Text style={{color: "#3498DB"}}>
                                    Umidade: {item.hum}%
                                </Text>
                                <Text style={{color: "#E74C3C"}}>
                                    Temperatura: {item.temp}°C
                                </Text>
                                <Text style={{color: "#fff"}}>
                                    Horário: {item.modified_date}
                                </Text>

                            </View>
                        }
                    />

                    <Pressable style={styles.histBtn} onPress={() => setHistoryVisible(!historyVisible)}>
                        <Text style={styles.btnText}>
                            Voltar aos dados
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#121212'
    },

    container: { 
        display: "flex",
        gap: 20,
        flex: 1, 
        padding: 20, 
        paddingTop: 40,
        alignItems: 'center'
    },

    list: {
        width: "100%"
    },

    header: { 
        color: '#FFF', 
        fontSize: 24,
        fontWeight: 'bold', 
        marginTop: 40,
        marginBottom: 20
    },

    btnText: { 
        color: '#FFF', 
        fontSize: 18,
        fontWeight: 'bold'
    },

    histBtn: {
        display: "flex",
        alignItems: "center",
        padding: 17,
        backgroundColor: "#3498DB",
        borderRadius: 15,
        marginBottom: 50,
        marginTop: 20,
        width: "100%"
    },

    item: {
        width: "100%",
        height: 100, 
        marginBottom: 20,
        padding: 10,
        borderRadius: 10,
        backgroundColor: "#000000",
        borderWidth: 1,
        borderColor: "#303030"
    }
});