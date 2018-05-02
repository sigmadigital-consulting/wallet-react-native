import React, { Component } from 'react';
import { View, AsyncStorage, StyleSheet, Text, Alert } from 'react-native';
import TransactionService from './../../../services/transactionService';
import Spinner from 'react-native-loading-spinner-overlay';
import ResetNavigation from './../../../util/resetNavigation';
import { Input, InputForm, Button } from './../../../components/common';
import Colors from './../../../config/colors';
import Header from './../../../components/header';
import Big from 'big.js';

class SendAmountEntryScreen extends Component {
  static navigationOptions = {
    title: 'Send money',
  };

  constructor(props) {
    super(props);
    const params = this.props.navigation.state.params;
    this.state = {
      recipient: params.recipient,
      balance: params.balance,
      amount: 0,
      note: '',
      disabled: false,
      loading: false,
      loadingMessage: '',
    };
  }

  send = async () => {
    if (this.state.amount <= 0) {
      Alert.alert('Invalid', 'Enter valid amount', [[{ text: 'OK' }]]);
    } else {
      const data = await AsyncStorage.getItem('currency');
      const currency = JSON.parse(data);
      let amount = new Big(this.state.amount);
      for (let i = 0; i < currency.divisibility; i++) {
        amount = amount.times(10);
      }
      Alert.alert(
        'Are you sure?',
        'Send ' +
          currency.symbol +
          this.state.amount +
          ' to ' +
          this.state.recipient,
        [
          {
            text: 'Yes',
            onPress: () => this.transferConfirmed(amount, currency.code),
          },
          {
            text: 'No',
            style: 'cancel',
          },
        ],
      );
    }
  };

  transferConfirmed = async (amount, currency) => {
    this.setState({
      loading: true,
      loadingMessage: 'Sending...',
    });
    const reference = await AsyncStorage.getItem('account_reference');
    let responseJson = await TransactionService.sendMoney(
      amount,
      this.state.recipient,
      this.state.note,
      currency,
      JSON.parse(reference),
    );
    if (responseJson.status === 'success') {
      this.successfulTransaction();
    } else {
      Alert.alert('Error', responseJson.message, [
        {
          text: 'OK',
          onPress: () => {
            this.setState({
              loading: false,
            });
          },
        },
      ]);
    }
  };

  successfulTransaction() {
    this.setState({
      loading: false,
    });
    Alert.alert('Success', 'Transaction successful', [
      {
        text: 'OK',
        onPress: () => {
          ResetNavigation.dispatchToSingleRoute(this.props.navigation, 'Home');
        },
      },
    ]);
  }

  amountChanged = text => {
    let amount = parseFloat(text);
    if (isNaN(amount)) {
      this.setState({ amount: 0 });
    } else {
      this.setState({ amount });
      if (amount > this.state.balance) {
        this.setState({
          disabled: true,
        });
      } else {
        this.setState({
          disabled: false,
        });
      }
    }
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Header navigation={this.props.navigation} back title="Send money" />
        <Spinner
          visible={this.state.loading}
          textContent={this.state.loadingMessage}
          textStyle={{ color: '#FFF' }}
        />
        <InputForm>
          <Input
            label="Amount"
            placeholder="Enter amount here"
            autoCapitalize="none"
            keyboardType="numeric"
            onChangeText={this.amountChanged}
          />
          <Input
            label="Note"
            placeholder="Enter note here"
            autoCapitalize="none"
            onChangeText={note => this.setState({ note })}
          />
          {this.state.disabled ? (
            <View
              style={[styles.submit, { backgroundColor: Colors.lightgray }]}>
              <Text style={{ color: 'white', fontSize: 20 }}>
                Amount exceeds balance
              </Text>
            </View>
          ) : (
            <Button
              label="SEND"
              type="primary"
              reference={input => {
                this.login = input;
              }}
              onPress={this.send}
            />
          )}
        </InputForm>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'white',
    paddingTop: 10,
  },
  submit: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 25,
    height: 50,
    backgroundColor: Colors.lightblue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SendAmountEntryScreen;
