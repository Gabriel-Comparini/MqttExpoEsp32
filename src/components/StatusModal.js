import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';

const StatusModal = ({ visible, onRetry, onLater }) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                    Não foi possível conectar ao Broker MQTT.
                    Verifique sua conexão e credenciais.
                </Text>

                <View>
                    <TouchableOpacity style={styles.btnRetry} onPress={onRetry}>
                        <Text style={styles.btnText}>Tentar Novamente</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnLater} onPress={onLater}>
                        <Text style={styles.btnText}>Tentar Mais Tarde</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    modalContent: {
        borderRadius: 20,
        backgroundColor: '#222',
        padding: 30,
        width: '85%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },

    modalText: {
        fontSize: 16,
        marginBottom: 25,
        textAlign: 'center',
        color: '#ffffff'
    },

    btnRetry: {
        backgroundColor: '#27AE60',
        padding: 15,
        borderRadius: 12,
        width: '100%',
        marginBottom: 12
    },

    btnLater: {
        backgroundColor: '#444',
        padding: 15,
        borderRadius: 12,
        width: '100%'
    },

    btnText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default StatusModal;