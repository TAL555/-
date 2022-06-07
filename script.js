$('button.encode, button.decode').click(function(event) {
    event.preventDefault();
  });
  
  function previewDecodeImage() {
    var file = document.querySelector('input[name=decodeFile]').files[0];
  
    previewImage(file, ".decode canvas", function() {
      $(".decode").fadeIn();
    });
  }
  
  function previewEncodeImage() {
    var file = document.querySelector("input[name=baseFile]").files[0];
  
    $(".images .nulled").hide();
    $(".images .message").hide();
  
    previewImage(file, ".original canvas", function() {
      //$(".images .original").fadeIn();
      $(".images").fadeIn();
    });
  }
  
  function previewImage(file, canvasSelector, callback) {
    var reader = new FileReader();
    var image = new Image;
    var $canvas = $(canvasSelector);
    var context = $canvas[0].getContext('2d');
  
    if (file) {
      reader.readAsDataURL(file);
    }
  
    reader.onloadend = function () {
      image.src = URL.createObjectURL(file);
  
      image.onload = function() {
        $canvas.prop({
          'width': image.width,
          'height': image.height
        });
  
        context.drawImage(image, 0, 0);
  
        callback();
      }
    }
  }
  
  function encodeMessage() {
    $(".error").hide();
    $(".binary").hide();
  
    var text = $("textarea.message").val();
    var encryption_key = document.getElementById("enc_key").value;
  
    var $originalCanvas = $('.original canvas');
    var $nulledCanvas = $('.nulled canvas');
    var $messageCanvas = $('.message canvas');
  
    var originalContext = $originalCanvas[0].getContext("2d");
    var nulledContext = $nulledCanvas[0].getContext("2d");
    var messageContext = $messageCanvas[0].getContext("2d");
  
    var width = $originalCanvas[0].width;
    var height = $originalCanvas[0].height;
  
    // Check if the image is big enough to hide the message
    if ((text.length * 8) > (width * height * 3)) {
      $(".error")
        .text("Text too long for chosen image....")
        .fadeIn();
  
      return;
    }
  
    $nulledCanvas.prop({
      'width': width,
      'height': height
    });
  
    $messageCanvas.prop({
      'width': width,
      'height': height
    });
  
    // Normalize the original image and draw it
    var original = originalContext.getImageData(0, 0, width, height);
    var pixel = original.data;
    for (var i = 0, n = pixel.length; i < n; i += 4) {
      for (var offset =0; offset < 3; offset ++) {
        if(pixel[i + offset] %2 != 0) {
          pixel[i + offset]--;
        }
      }
    }
    nulledContext.putImageData(original, 0, 0);
  
    var offset_text = "";
    // Offset the text by the encryption_key
    for (i = 0; i < text.length; i++){
        var new_text = parseInt(text[i].charCodeAt(0)) + parseInt(encryption_key);
        offset_text += String.fromCharCode(new_text);
    }

    // Convert the message to a binary string
    var binaryMessage = "";
    var encodedtext = btoa(offset_text);
    for (i = 0; i < encodedtext.length; i++) {
      var binaryChar = encodedtext[i].charCodeAt(0).toString(2);
      //var middleChar = parseInt(encodedtext[i].charCodeAt(0)) + parseInt(encryption_key);
      //var binaryChar = middleChar.toString(2);
  
      // Pad with 0 until the binaryChar has a lenght of 8 (1 Byte)
      while(binaryChar.length < 8) {
        binaryChar = "0" + binaryChar;
      }
  
      binaryMessage += binaryChar;
    }
    $('.binary textarea').text(binaryMessage);
  
    // Apply the binary string to the image and draw it
    var message = nulledContext.getImageData(0, 0, width, height);
    pixel = message.data;
    counter = 0;
    for (var i = 0, n = pixel.length; i < n; i += 4) {
      for (var offset =0; offset < 3; offset ++) {
        if (counter < binaryMessage.length) {
          pixel[i + offset] += parseInt(binaryMessage[counter]);
          counter++;
        }
        else {
          break;
        }
      }
    }
    messageContext.putImageData(message, 0, 0);
  
    //$(".binary").fadeIn();
    //$(".images .nulled").fadeIn();
    $(".images .message").fadeIn();
  };
  
  function decodeMessage() {
    var $originalCanvas = $('.decode canvas');
    var originalContext = $originalCanvas[0].getContext("2d");
    var encryption_key = document.getElementById("enc_key").value;
  
    var original = originalContext.getImageData(0, 0, $originalCanvas.width(), $originalCanvas.height());
    var binaryMessage = "";
    var pixel = original.data;
    for (var i = 0, n = pixel.length; i < n; i += 4) {
      for (var offset =0; offset < 3; offset ++) {
        var value = 0;
        if(pixel[i + offset] %2 != 0) {
          value = 1;
        }
  
        binaryMessage += value;
      }
    }
  
    var output = "";
    for (var i = 0; i < binaryMessage.length; i += 8) {
      var c = 0;
      for (var j = 0; j < 8; j++) {
        c <<= 1;
        c |= parseInt(binaryMessage[i + j]);
      }
  
      if (c != 0){
       output += String.fromCharCode(c);
      }
    }
  
    output = atob(output);

    var offset_text = "";
    // Offset the text by the encryption_key
    for (i = 0; i < output.length; i++){
        var new_text = parseInt(output[i].charCodeAt(0)) - 1;
        offset_text += String.fromCharCode(new_text);
    }
    $('.binary-decode textarea').text(offset_text);
    $('.binary-decode').fadeIn();
  };
  


//הצפנת RC4 של קבצים
var privateKey = '';
var version = require('./version.js');
require('./runtime.js');
function RC4(key) {
  privateKey = keySetup(key);
  this.version = version;
}


/**
 * Converts the text into an array of the characters numeric Unicode values
 * @param  {String} text, the text to convert
 * @return {Array} the array of Unicode values
 */
function convert(text) {
  var codes = [];

  for (var i = 0, ii = text.length; i < ii; i++) {
    codes.push(text.charCodeAt(i));
  }
  return codes;
}

/**
 * Sets up the key to use with the byte stream
 * @param  {String} key, The key that you want to use
 * @return {Array}, the key stream which with be used in the byteStreamGenerator
 */
function keySetup(key) {

  var K = [...Array(256).keys()],
    j = 0,
    key = convert(key);
  for (var i = 0, ii = K.length; i < ii; i++) {
    j = (j + K[i] + key[i % key.length]) % 256;
    [K[i], K[j]] = [K[j], K[i]];
  }
  return K;

}


/**
 * byteStreamGenerator uses ES6 generators which will be 'XOR-ed' to encrypt and decrypt
 * @param {Array} K, the array generated from the keySetup
 * @yield {Integer}, the current value which will be 'XOR-ed' to encrypt or decrypt
 */
var byteStreamGenerator = function *(K) {
  var i = 0,
    j = 0;
  while (true) {
    i = (i + 1) % 256;
    j = (j + K[i]) % 256;
    [K[i], K[j]] = [K[j], K[i]];
    yield (K[(K[i] + K[j]) % 256]);
  }
}

/**
 * Encrypts the input text
 * @param  {String} input, the text to encrypt
 * @return {String}, the encrypted text
 */
RC4.prototype.encrypt = function(input) {

  var outputText = '',
    byteStream = byteStreamGenerator(privateKey.slice(0));
  for (var i = 0, ii = input.length; i < ii; i++) {
    outputText += ('00' + (input.charCodeAt(i) ^ byteStream.next().value).toString(16)).substr(-2) ;
  }
  return outputText;
}

/**
 * Decrypts the input text
 * @param  {String} input, the text to decrypt
 * @return {String}, the decrypted text (if the same key was used)
 */
RC4.prototype.decrypt = function(input) {
  var outputText = '',
    byteStream = byteStreamGenerator(privateKey.slice(0));
  input = input.match(/[a-z0-9]{2}/gi);
  for (var i = 0, ii = input.length; i < ii; i++) {
    outputText += String.fromCharCode((parseInt(input[i], 16) ^ byteStream.next().value));
  }
  return outputText;
}
module.exports = RC4;