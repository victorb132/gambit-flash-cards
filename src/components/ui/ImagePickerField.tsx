import React, { useState } from 'react';
import { TouchableOpacity, Image, Alert, ActivityIndicator, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@shopify/restyle';
import { Image as ImageIcon, X } from 'phosphor-react-native';
import Box from './Box';
import Text from './Text';
import { Theme } from '../../theme';

interface ImagePickerFieldProps {
  label: string;
  value?: string;
  onChange: (uri: string | undefined) => void;
}

export default function ImagePickerField({ label, value, onChange }: ImagePickerFieldProps) {
  const theme = useTheme<Theme>();
  const [loading, setLoading] = useState(false);

  async function handlePick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para adicionar imagens.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setLoading(true);
    try {
      // Copy to app's document directory for persistence
      const src = result.assets[0].uri;
      const filename = src.split('/').pop() ?? `img_${Date.now()}.jpg`;
      const dest = FileSystem.documentDirectory + filename;
      await FileSystem.copyAsync({ from: src, to: dest });
      onChange(dest);
    } catch {
      // Fallback: use the picker URI directly
      onChange(result.assets[0].uri);
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    onChange(undefined);
  }

  if (value) {
    return (
      <Box marginTop="s">
        <Text variant="caption" color="textSecondary" marginBottom="xs">
          {label}
        </Text>
        <TouchableOpacity onPress={handlePick} disabled={loading} activeOpacity={0.85} accessibilityLabel={`Trocar imagem: ${label}`}>
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: value }}
              style={{
                width: '100%',
                height: 160,
                borderRadius: 10,
                backgroundColor: theme.colors.surfaceLight,
              }}
              resizeMode="cover"
            />
            {loading ? (
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 10 }}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>Trocar foto</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleRemove}
              accessibilityLabel="Remover imagem"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.55)',
                borderRadius: 16,
                padding: 4,
              }}
            >
              <X size={16} color="#fff" weight="bold" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Box>
    );
  }

  return (
    <Box marginTop="s">
      <Text variant="caption" color="textSecondary" marginBottom="xs">
        {label}
      </Text>
      <TouchableOpacity onPress={handlePick} disabled={loading} accessibilityLabel={`Adicionar imagem: ${label}`}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          style={{
            gap: 8,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            borderRadius: 10,
            borderStyle: 'dashed',
            paddingVertical: 14,
            backgroundColor: theme.colors.surfaceLight,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
          ) : (
            <>
              <ImageIcon size={18} color={theme.colors.textSecondary} />
              <Text variant="caption" color="textSecondary">
                Adicionar imagem (opcional)
              </Text>
            </>
          )}
        </Box>
      </TouchableOpacity>
    </Box>
  );
}
