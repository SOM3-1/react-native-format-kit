module.exports = {
  presets: ["@react-native/babel-preset"],
  overrides: [
    {
      test: [/\.ts$/, /\.tsx$/],
      presets: [["@babel/preset-typescript", { allowDeclareFields: true }]],
    },
  ],
}
