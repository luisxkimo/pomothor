import React, {useState, useEffect} from 'react';

import withFirebaseAuth from 'react-with-firebase-auth'
import Firebase from 'firebase';
import 'firebase/auth';
import firebaseConfig from './configs/firebaseConfig';

import {Navbar} from './components/navbar';
import {BadgeAvatar} from './components/BadgeAvatar';
import {Status} from './components/Status';
import Countdown from 'react-countdown';

import {Button, Box, Grid, Card, CardHeader, TextField, Typography, LinearProgress} from '@material-ui/core';

import {locale} from './locale/en-us';

const firebaseApp = Firebase.initializeApp(firebaseConfig);
const firebaseAppAuth = firebaseApp.auth();
const providers = {
  googleProvider: new Firebase.auth.GoogleAuthProvider(),
};

function App(props) {
  const {user, signOut, signInWithGoogle,} = props;
  const [minutes, setMinutes] = useState(0);
  const [pomodorosList, setPomodorosList] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getPomodorosListData();
  }, []);

  const Counter = (pomodoroKey) => {
    const pomodoro = pomodorosList[pomodoroKey];

    return (
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Card>
          <Countdown date={pomodoro.time}
                     renderer={(countdownData) => (
                       <CardHeader avatar={<BadgeAvatar countdownData={countdownData} pomodoro={pomodoro} />}
                                   title={pomodoro.userName}
                                   subheader={<Status user={user} countdownData={countdownData} pomodoro={pomodoro} />}
                       />)
                     }
          />
        </Card>
      </Grid>
    )
  };

  const getPomodorosListData = () => {
    setIsLoading(true);
    let ref = Firebase.database().ref('/pomodoros');
    ref.on('value', snapshot => {
      const list = snapshot.val();
      setPomodorosList(list || {});
      setIsLoading(false);
    });
  };

  const handleStartPomodoro = (e) => {
    e.preventDefault();
    const ref = Firebase.database().ref('/pomodoros');
    ref.once('value')
      .then(() => {
        const pomodoro = {userId: user.uid, userName: user.displayName, userPhotoURL: user.photoURL, time: Date.now() + (minutes * 60000)};
        Firebase.database().ref(`/pomodoros/${user.uid}`).set(pomodoro);
    })
  };

  return (
    isLoading
      ? <LinearProgress />
      : <>
        <Navbar user={user} onSignIn={signInWithGoogle} onSignOut={signOut} />
          <Grid container direction="column">
            {
              user
                ? <Box px={4}>
                    <Grid item>
                      <Grid container justify="flex-end" alignItems="flex-end" spacing={2}>
                        <Grid item>
                          <Box py={4}>
                            <form onSubmit={(e) => handleStartPomodoro(e)}>
                              <TextField
                                id="time"
                                label={locale.FocusTimeCapitalize}
                                placeholder={locale.MinutesLowercase}
                                onChange={(e) => setMinutes(e.target.value)}
                              />
                              <Button type="submit" variant="contained" color="primary">{locale.Start}</Button>
                            </form>
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Box pb={2}>
                        <Typography variant="h4" component="h4">{locale.Users}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        {Object.keys(pomodorosList).map(pomodoroKey => Counter(pomodoroKey))}
                      </Grid>
                    </Grid>
                  </Box>
                : <Grid item xs={12}>
                    <Typography variant="h4" component="h4">{locale.PleaseSignInCapitalize}</Typography>
                  </Grid>
            }
          </Grid>
        </>
  );
}

export default withFirebaseAuth({
  providers,
  firebaseAppAuth,
})(App);
