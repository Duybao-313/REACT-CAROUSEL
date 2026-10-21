import React from "react";
import { View } from "react-native";
import { ViewPropTypes } from "deprecated-react-native-prop-types";
import { StatusBar } from "expo-status-bar";
import Bai02 from "./lap1/bai2";

if (!View.propTypes) {
  View.propTypes = ViewPropTypes;
}

export default function App() {
  return (
    <>
      <Bai02 />
      <StatusBar style="auto" />
    </>
  );
}
