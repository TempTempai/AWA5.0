var awatisms = {
  "nop": 0,
  "prn": 1,
  "pr1": 2,
  "red": 3,
  "r3d": 4,
  "blo": 5,
  "sbm": 6,
  "pop": 7,
  "dpl": 8,
  "srn": 9,
  "mrg": 10,
  "4dd": 11,
  "sub": 12,
  "mul": 13,
  "div": 14,
  "cnt": 15,
  "lbl": 16,
  "jmp": 17,
  "eql": 18,
  "lss": 19,
  "gr8": 20,
  "trm": 31
};

function ReadAwaTalk(awaBlock) {
  var commands = [];

  //Clean the input, including caps-cleaning
  var cleanedAwas = awaBlock.replace(/[^aw\s]+/gi, '').toLowerCase();

  //Find the first awa
  var awaIndex = 0;
  for (; awaIndex < cleanedAwas.length - 3; awaIndex++) {
    if (cleanedAwas.substr(awaIndex, 3) == "awa") {
      awaIndex += 3;
      break;
    }
  }
  if (awaIndex >= cleanedAwas.length - 3)
    return commands;

  //Continue from there
  var bitCounter = 0;
  var targetBit = 5;
  var newValue = 0;

  var param = false;
  var signed = false; //Not implemented yet

  while (awaIndex < cleanedAwas.length - 1) {

    //Determine if it's 0, 1 or error
    if (cleanedAwas.substr(awaIndex, 2) == "wa") {

      //Set the newValue to all 0b1's if it's a signed negative number
      if (bitCounter == 0 && signed)
        newValue = -1;
      else {
        bitCounter++;
        newValue <<= 1;
        newValue += 1;
        awaIndex += 2;
      }
    } else if (awaIndex < cleanedAwas.length - 3 && cleanedAwas.substr(awaIndex, 4) == " awa") {
      bitCounter++;
      newValue <<= 1;
      awaIndex += 4;
    } else {
      //Incorrect formatting, we'll just keep stepping til the awas are aligned
      awaIndex++;
    }

    //When the correct bit count is reached, add the new command or parameter
    if (bitCounter >= targetBit) {

      //signed/unsigned are handled automatically due to two's complement format
      commands.push(newValue);

      //clean up
      bitCounter = 0;
      if (param) {
        targetBit = 5;
        param = false;
        signed = false;
      } else {
        //determine what to do here
        switch (newValue) {
          case awatisms.blo:
          case awatisms.sbm:
          case awatisms.srn:
          case awatisms.lbl:
          case awatisms.jmp:
            //idk, fill in later, I'm out of time
            if (newValue == awatisms.blo) {
              targetBit = 8;
              signed = true;
            } else {
              targetBit = 5;
              signed = false;
            }
            param = true;
            break;
          default:
            //values are already correct, no change
            break;
        }
      }
      newValue = 0;
    }
  }

  var title = document.getElementById('outputField');
  title.value = cleanedAwas;

  return commands;
}

var emergencyStop = false;
var lblTable = { };
var bubbleAbyss = []; //Remember it'll be backwards here!
var commandsList = {};

function runCode() {

  //Eventually make this Async so we can stop infinite running code
  var codeStr = document.getElementById('codeField').value;

  //Convert from Awatalk
  commandsList = ReadAwaTalk(codeStr);

  //Clear the output
  var title = document.getElementById('outputField');
  title.value = "";



  //Run code (async)
  emergencyStop = false;

  document.getElementById('runBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;

  codeLoop(); //async, so handle the end events elsewhere
}

function stopRunning() {
  emergencyStop = true;
}

async function codeLoop() {
  //Do initial code check for lbls
  lblTable = { };
  var commandsCount = 0;
  for (i = 0; i < commandsList.length; i++) {
  	commandsCount++;
    switch (commandsList[i]) {
      case awatisms.lbl:
        //Main case to catch, store in table
        lblTable[commandsList[i + 1]] = i + 1; //store position of label under the label parameter tag
        i++;
        break;
      case awatisms.blo:
      case awatisms.sbm:
      case awatisms.srn:
      case awatisms.jmp:
        i++;
        break;
      default:
        break;
    }
  }

  bubbleAbyss = [];

  //step through each 
  var i = 0;
  var terminate = false;
  var commandTime = 0;
  while (i < commandsList.length && !terminate && !emergencyStop) {
    //
    switch (commandsList[i]) {
      case awatisms.nop: //!
        break;

      case awatisms.prn: //!
        printBubble(bubbleAbyss.pop(), false);
        break;

      case awatisms.pr1: //!
        printBubble(bubbleAbyss.pop(), true);
        break;

      case awatisms.red:
        var input = await waitInput();
        var newBubble = [];
        for (j = input.length - 1; j >= 0; j--) {
          var awaVal = AwaSCII.indexOf(input.substr(j, 1));
          if (awaVal != -1)
            newBubble.push(awaVal);
        }
        //read as characters
        bubbleAbyss.push(newBubble);
        break;

      case awatisms.r3d: //!
        var input = await waitInput();
        //read single number, assume it's clean enough
        var num = parseInt(input);
        bubbleAbyss.push(num);
        break;

      case awatisms.blo: //!
        i++;
        bubbleAbyss.push(commandsList[i]);
        break;

      case awatisms.sbm: //!
        i++;
        var bubble = bubbleAbyss.pop();
        if(commandsList[i] == 0) {
        	bubbleAbyss.unshift(bubble);
        } else {
        	bubbleAbyss.splice(bubbleAbyss.length - commandsList[i], 0, bubble);
        }
        break;

      case awatisms.pop: //!
        var bubble = bubbleAbyss.pop();
        while (bubble.length > 0) {
          bubbleAbyss.push(bubble.shift());
        }
        break;

      case awatisms.dpl: //?
        var newBubble = structuredClone(bubbleAbyss[bubbleAbyss.length - 1]);
        bubbleAbyss.push(newBubble);
        break;

      case awatisms.srn: //?
        i++;
        var newBubble = [];
        for (j = 0; j < commandsList[i]; j++) {
          newBubble.unshift(bubbleAbyss.pop());
        }
        bubbleAbyss.push(newBubble);
        break;

      case awatisms.mrg: //!
      
        var bubble1 = bubbleAbyss.pop();
        var bubble2 = bubbleAbyss.pop();

        var b1IsDouble = isDouble(bubble1);
        var b2IsDouble = isDouble(bubble2);
				
        if (!b1IsDouble && !b2IsDouble) {
        
          var newBubble = [];
          newBubble.push(bubble2);
          newBubble.push(bubble1);
          
          bubbleAbyss.push(newBubble);
        } else if (b1IsDouble && !b2IsDouble) {
          bubble1.unshift(bubble2);
          bubbleAbyss.push(bubble1);
        } else if (!b1IsDouble && b2IsDouble) {
          bubble2.push(bubble1);
          bubbleAbyss.push(bubble2);
        } else { //if (b1IsDouble && b2IsDouble) {
          while (bubble1.length > 0) {
            bubble2.push(bubble1.shift());
          }
          bubbleAbyss.push(bubble2);
        }

        break;

      case awatisms["4dd"]: //!
        var bubble1 = bubbleAbyss.pop();
        var bubble2 = bubbleAbyss.pop();

        bubbleAbyss.push(addBubbles(bubble1, bubble2));
        break;

      case awatisms.sub: //!
        var bubble1 = bubbleAbyss.pop();
        var bubble2 = bubbleAbyss.pop();

        bubbleAbyss.push(subBubbles(bubble1, bubble2));
        break;

      case awatisms.mul: //!
        var bubble1 = bubbleAbyss.pop();
        var bubble2 = bubbleAbyss.pop();

        bubbleAbyss.push(mulBubbles(bubble1, bubble2));
        break;

      case awatisms.div: //!
        var bubble1 = bubbleAbyss.pop();
        var bubble2 = bubbleAbyss.pop();

        bubbleAbyss.push(divBubbles(bubble1, bubble2));
        break;

      case awatisms.cnt: //!
        if (isDouble(bubbleAbyss[bubbleAbyss.length - 1]))
          bubbleAbyss.push(bubbleAbyss[bubbleAbyss.length - 1].length);
        else
          bubbleAbyss.push(0);
        break;

      case awatisms.lbl: //!
        //No function, skip the parameter
        i++;
        break;

      case awatisms.jmp: //?
        i++;
        if (commandsList[i] in lblTable)
          i = lblTable[commandsList[i]];
        break;

      case awatisms.eql: //!
        if (!isDouble(bubbleAbyss[bubbleAbyss.length - 1]) &&
          !isDouble(bubbleAbyss[bubbleAbyss.length - 2]) &&
          bubbleAbyss[bubbleAbyss.length - 1] == bubbleAbyss[bubbleAbyss.length - 2]) {
          //True, execute next line
        } else {
          i++; //skip next line
        }
        break;

      case awatisms.lss: //!
        if (!isDouble(bubbleAbyss[bubbleAbyss.length - 1]) &&
          !isDouble(bubbleAbyss[bubbleAbyss.length - 2]) &&
          bubbleAbyss[bubbleAbyss.length - 1] < bubbleAbyss[bubbleAbyss.length - 2]) {
          //True, execute next line
        } else {
          i++; //skip next line
        }
        break;

      case awatisms.gr8: //!
        if (!isDouble(bubbleAbyss[bubbleAbyss.length - 1]) &&
          !isDouble(bubbleAbyss[bubbleAbyss.length - 2]) &&
          bubbleAbyss[bubbleAbyss.length - 1] > bubbleAbyss[bubbleAbyss.length - 2]) {
          //True, execute next line
        } else {
          i++; //skip next line
        }
        break;

      case awatisms.trm: //!
        terminate = true;
        break;
    }

    //Next command
    if(commandsList[i] != awatisms.lbl)
    	commandTime++;
    i++;
  }

  //Success...?


  document.getElementById('runBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('info').value = "commands: " + commandsCount + "   time: " + commandTime;
}

function output(str) {
  var title = document.getElementById('outputField');
  title.value += str;
}

function addBubbles(bubble1, bubble2) {
  var b1IsDouble = isDouble(bubble1);
  var b2IsDouble = isDouble(bubble2);

  if (!b1IsDouble && !b2IsDouble) {
    return bubble1 + bubble2;
  } else if (b1IsDouble && !b2IsDouble) {
    bubble1.forEach((element, index) => {
      bubble1[index] = addBubbles(element, bubble2);
    });
    return bubble1;
  } else if (!b1IsDouble && b2IsDouble) {
    bubble2.forEach((element, index) => {
      bubble2[index] = addBubbles(bubble1, element);
    });
    return bubble2;
  } else { //if (b1IsDouble && b2IsDouble) {
    var newBubble = [];
    var i = 0;
    for (; i < bubble1.length && i < bubble2.length; i++)
      newBubble.unshift(addBubbles(bubble1[bubble1.length - 1 - i], bubble2[bubble2.length - 1 - i]));

    //leave out any unpaired bubbles
    return newBubble;
  }
}

function subBubbles(bubble1, bubble2) {
  var b1IsDouble = isDouble(bubble1);
  var b2IsDouble = isDouble(bubble2);

  if (!b1IsDouble && !b2IsDouble) {
    return bubble1 - bubble2;
  } else if (b1IsDouble && !b2IsDouble) {
    bubble1.forEach((element, index) => {
      bubble1[index] = subBubbles(element, bubble2);
    });
    return bubble1;
  } else if (!b1IsDouble && b2IsDouble) {
    bubble2.forEach((element, index) => {
      bubble2[index] = subBubbles(bubble1, element);
    });
    return bubble2;
  } else { //if (b1IsDouble && b2IsDouble) {
    var newBubble = [];
    var i = 0;
    for (; i < bubble1.length && i < bubble2.length; i++)
      newBubble.unshift(subBubbles(bubble1[bubble1.length - 1 - i], bubble2[bubble2.length - 1 - i]));

    //leave out any unpaired bubbles
    return newBubble;
  }
}

function mulBubbles(bubble1, bubble2) {
  var b1IsDouble = isDouble(bubble1);
  var b2IsDouble = isDouble(bubble2);

  if (!b1IsDouble && !b2IsDouble) {
    return bubble1 * bubble2;
  } else if (b1IsDouble && !b2IsDouble) {
    bubble1.forEach((element, index) => {
      bubble1[index] = mulBubbles(element, bubble2);
    });
    return bubble1;
  } else if (!b1IsDouble && b2IsDouble) {
    bubble2.forEach((element, index) => {
      bubble2[index] = mulBubbles(bubble1, element);
    });
    return bubble2;
  } else { //if (b1IsDouble && b2IsDouble) {
    var newBubble = [];
    var i = 0;
    for (; i < bubble1.length && i < bubble2.length; i++)
      newBubble.unshift(mulBubbles(bubble1[bubble1.length - 1 - i], bubble2[bubble2.length - 1 - i]));

    //leave out any unpaired bubbles
    return newBubble;
  }
}

function divBubbles(bubble1, bubble2) {
  var b1IsDouble = isDouble(bubble1);
  var b2IsDouble = isDouble(bubble2);

  var newDivBubble = [];

  if (!b1IsDouble && !b2IsDouble) {
    newDivBubble.push(bubble1 % bubble2);
    var temp = bubble1 / bubble2;
    newDivBubble.push(Math[temp < 0 ? 'ceil' : 'floor'](temp));
    return newDivBubble;
  } else if (b1IsDouble && !b2IsDouble) {
    bubble1.forEach((element, index) => {
      bubble1[index] = divBubbles(element, bubble2);
    });
    return bubble1;
  } else if (!b1IsDouble && b2IsDouble) {
    bubble2.forEach((element, index) => {
      bubble2[index] = divBubbles(bubble1, element);
    });
    return bubble2;
  } else { //if (b1IsDouble && b2IsDouble) {
    var newBubble = [];
    var i = 0;
    for (; i < bubble1.length && i < bubble2.length; i++)
      newBubble.unshift(divBubbles(bubble1[bubble1.length - 1 - i], bubble2[bubble2.length - 1 - i]));

    //leave out any unpaired bubbles
    return newBubble;
  }
}


var AwaSCII = "AWawJELYHOSIUMjelyhosiumPCNTpcntBDFGRbdfgr0123456789 .,!'()~_/;\n"; //???

function printBubble(bubble, numbersOut) {
  if (!isDouble(bubble)) {
    if (numbersOut) {
      //print number directly
      output(bubble + " ");
    } else {
      //use AwaSCII
      if (bubble >= 0 && bubble < AwaSCII.length) {
        output(AwaSCII[bubble]);
      }
    }
  } else {
    var i = bubble.length - 1;
    for (; i >= 0; i--) {
      printBubble(bubble[i], numbersOut);
    }
  }
}

async function waitInput() {
  var inpWait;
  let myPromise = new Promise(function(resolve) {
    document.getElementById('inputBtn').disabled = false;
    document.getElementById('inputBtn').addEventListener("click", inpWait = function() {
      resolve(document.getElementById('inputField').value);
    });
  });
  var s = await myPromise;

  document.getElementById('inputBtn').removeEventListener("click", inpWait);
  document.getElementById('inputBtn').disabled = true;

  return s;
}

function isDouble(bubble) {
  return typeof(bubble) === 'object';
}




function testCode() {

  //Eventually make this Async so we can stop infinite running code
  var codeStr = document.getElementById('codeField').value;

  //Convert from Awatalk
  var commandsStrs = codeStr.split(" ");
  commandsList = [];
  for (i = 0; i < commandsStrs.length; i++) {
    commandsList.push(parseInt(commandsStrs[i]));
  }

  var title = document.getElementById('outputField');
  title.value = "";



  //Run code (async)
  emergencyStop = false;

  document.getElementById('runBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;

  codeLoop(); //async, so handle the end events elsewhere
}
