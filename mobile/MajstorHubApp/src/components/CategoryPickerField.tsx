import { useState } from 'react';
import { Button, Menu } from 'react-native-paper';
import type { ServiceCategoryResponse } from '../types/api';

export function CategoryPickerField({
  categories,
  selectedCategoryId,
  onSelect,
}: {
  categories: ServiceCategoryResponse[];
  selectedCategoryId: number | null;
  onSelect: (categoryId: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  const selected = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button mode="outlined" onPress={() => setVisible(true)}>
          {selected ? selected.name : 'Select a category'}
        </Button>
      }
    >
      {categories.map((category) => (
        <Menu.Item
          key={category.id}
          title={category.name}
          onPress={() => {
            onSelect(category.id);
            setVisible(false);
          }}
        />
      ))}
    </Menu>
  );
}
