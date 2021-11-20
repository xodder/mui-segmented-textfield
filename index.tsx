import {
  AppBar,
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  colors,
  FormHelperText,
  Link as MuiLink,
  TextField,
  TextFieldProps,
  Toolbar,
  Typography,
  useControlled,
  useTheme,
} from '@material-ui/core';
import { useResendVerificationCode, useVerifyAccount } from 'helpers/auth';
import { useActiveUser } from 'helpers/users';
import { Check } from 'mdi-material-ui';
import BackButton from 'pages/shared/back-button';
import BusyFab from 'pages/shared/busy-fab';
import DottedDivider from 'pages/shared/dotted-divider';
import { Center, Column, Row, Spacer } from 'pages/shared/layout';
import Page from 'pages/shared/page';
import { popupish } from 'pages/shared/popup-ish';
import React from 'react';
import { useHistory } from 'react-router';

const CODE_LENGTH = 5;

function AccountVerificationPage() {
  const { user } = useActiveUser();
  const theme = useTheme();
  const history = useHistory();
  const [code, setCode] = React.useState('');
  const [codeError, setCodeError] = React.useState<string | undefined>(
    undefined
  );
  const medium = user.verification.medium;
  const canSubmit = code.replace(/\s/g, '').length === CODE_LENGTH;

  const { resendCode, isRunning: isSendingCode } = useResendVerificationCode({
    onSuccess: () => {
      popupish.notify({
        message: 'Verification code sent',
      });
    },
    onError: (error) => {
      showGeneralError(error);
    },
  });

  const { verifyAccount, isRunning } = useVerifyAccount({
    onSuccess: () => {
      popupish.notify({
        message: 'Account verified successfully',
      });

      if (!user.specializationId) {
        history.replace('/a/specialization');
      } else {
        history.replace('/');
      }
    },
    onError: (error) => {
      if (error.meta?.fields?.code) {
        setCodeError(error.meta.fields.code);
      } else {
        showGeneralError(error);
      }
    },
  });

  function handleCodeChange(value: string) {
    setCode(value);
    if (codeError) {
      setCodeError(undefined);
    }
  }

  function handleResendCode() {
    resendCode();
  }

  function handleSubmit(e: any) {
    e.preventDefault();
    if (!codeError) {
      verifyAccount({ code });
    }
  }

  return (
    <Page>
      <AppBar position="sticky">
        <Toolbar>
          <BackButton edge="start" />
        </Toolbar>
      </AppBar>
      <Column py={3} crossAxisAlignment="center" maxWidth="80%" mx="auto">
        <Avatar>
          <i />
        </Avatar>
        <Spacer sy={2} />
        <Typography
          variant="h5"
          style={{ fontWeight: theme.typography.fontWeightBold }}
        >
          Verify your Account
        </Typography>
        <Spacer sy={1} />
        <Typography align="center">
          {medium === 'phone'
            ? 'A verification code has been sent to the phone number you provided.'
            : 'A verification code has been sent to the email address you provided.'}
        </Typography>
        <Spacer sy={2} />
        <Row
          pl={1}
          pr={2}
          py={0.5}
          maxWidth={1}
          bgcolor="grey.200"
          borderRadius={24}
          crossAxisAlignment="center"
          overflow="hidden"
        >
          <Box
            width={16}
            height={16}
            borderRadius="50%"
            bgcolor={colors.cyan[500]}
            flexShrink={0}
          />
          <Spacer sx={1} />
          <Typography variant="subtitle2" noWrap>
            {medium === 'phone' ? user.phoneNumber : user.email}
          </Typography>
        </Row>
      </Column>
      <DottedDivider px={8} width={1} dotCount={28} mt={2} mb={6} my={0} />
      <Column
        component="form"
        onSubmit={handleSubmit}
        crossAxisAlignment="center"
      >
        <Typography variant="body2">
          Enter the {CODE_LENGTH}-digit code
        </Typography>
        <Spacer sy={1.5} />
        <SegmentedTextField
          type="number"
          variant="outlined"
          amount={CODE_LENGTH}
          value={code}
          onChange={handleCodeChange}
          seperator={<Spacer sx={1.5} />}
          error={!!codeError}
          helperText={codeError}
          inputMode="numeric"
          inputProps={{
            style: {
              fontSize: 18,
              width: 42,
              height: 42,
              padding: 0,
              fontWeight: 'bold',
            },
          }}
          disabled={isRunning}
          autoFocus
        />
        <Spacer sy={5} />
        <Typography variant="body2">
          Didn't get the code?&nbsp;
          <MuiLink
            onClick={handleResendCode}
            variant="subtitle2"
            style={{ cursor: 'pointer' }}
          >
            Try Again
          </MuiLink>
        </Typography>
        <BusyFab type="submit" busy={isRunning} disabled={!canSubmit}>
          <Check />
        </BusyFab>
      </Column>
      <Backdrop open={isSendingCode} style={{ zIndex: theme.zIndex.modal + 3 }}>
        <Center
          position="relative"
          dir="column"
          width={1}
          height={1}
          color="white"
        >
          <CircularProgress color="inherit" />
        </Center>
      </Backdrop>
    </Page>
  );
}

type ChangeHandler = React.ChangeEventHandler<HTMLInputElement>;
type KeyUpHandler = React.KeyboardEventHandler<HTMLInputElement>;

type SegmentedTextFieldProps = Omit<
  TextFieldProps,
  | 'multiline'
  | 'inputRef'
  | 'rows'
  | 'rowsMax'
  | 'select'
  | 'SelectProps'
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
> & {
  amount: number;
  onChange?: (value: string) => void;
  seperator?: React.ReactNode;
};

// value, defaultValue, autoFocus, error, helperText, label, name, placeholder, onChange, onBlur, onFocus,

function SegmentedTextField({
  amount = 6,
  value: valueProp,
  defaultValue,
  autoFocus,
  helperText,
  FormHelperTextProps,
  label,
  name,
  placeholder,
  onChange,
  seperator,
  ...props
}: SegmentedTextFieldProps) {
  const inputRef = React.useRef<HTMLElement[]>([]);
  const [values, setValues] = useControlled<string[]>({
    name: 'SegmentedTextField',
    state: 'value',
    default: toValues((defaultValue || '') as string),
    controlled:
      valueProp !== undefined ? toValues(valueProp as string) : undefined,
  });

  function toValues(val: string) {
    return Array.from({ length: amount }, (_, i) => val[i] || ' ');
  }

  function setInputValue(index: number, value: string) {
    const newValues = [...values];
    newValues[index] = value;

    if (onChange) {
      onChange(newValues.join(''));
    } else {
      setValues(newValues);
    }
  }

  function makeOnChangeHandler(index: number): ChangeHandler {
    return (e) => {
      const newValue = e.target.value.trim();
      if (newValue.length <= 1) {
        setInputValue(index, newValue);
      }

      const canNext = index < amount - 1 && newValue.length > 0;
      if (canNext) {
        inputRef.current[index + 1].focus();
        // puts the just entered character into the next field
        // if the current field is not empty
        if (newValue.length > 1) {
          setInputValue(index + 1, newValue[newValue.length - 1]);
        }
      }
    };
  }

  function makeOnKeyUpHandler(index: number): KeyUpHandler {
    return (e) => {
      const canBack = e.key.toLowerCase() === 'backspace' && index > 0;
      if (canBack) {
        inputRef.current[index - 1].focus();
      }
    };
  }

  return (
    <Column>
      <Row crossAxisAlignment="center">
        {Array.from({ length: amount }, (_, i) => {
          return (
            <React.Fragment key={i}>
              <TextField
                {...props}
                autoFocus={i === 0 && autoFocus}
                inputRef={(x) => {
                  inputRef.current[i] = x!;
                }}
                value={values[i] || ' '}
                InputProps={{
                  ...props.InputProps,
                  onChange: makeOnChangeHandler(i),
                  onKeyUp: makeOnKeyUpHandler(i),
                }}
                inputProps={{
                  ...props.inputProps,
                  style: {
                    ...props.inputProps?.style,
                    textAlign: 'center',
                  },
                }}
              />
              {i < amount - 1 && seperator}
            </React.Fragment>
          );
        })}
      </Row>
      {helperText && (
        <FormHelperText
          {...FormHelperTextProps}
          variant={props.variant}
          error={props.error}
          disabled={props.disabled}
        >
          {helperText}
        </FormHelperText>
      )}
    </Column>
  );
}

function showGeneralError(error: { message: string }) {
  const n = popupish.notify({
    message: error.message,
    autoHideDuration: null,
    action: (
      <Button color="primary" onClick={() => n.close()}>
        Ok
      </Button>
    ),
  });
}

export default AccountVerificationPage;
