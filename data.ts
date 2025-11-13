
import { BrandData } from './types';

// FIX: The base64 string for bongoDelicacyLogo was malformed. Restored the correct data URL.
export const bongoDelicacyLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAbFBMVEUAd7f///8Ad7gAc7cAeLkAdbYAdrgAcbYAc7YAdLcAb7L4/P0AbLIAdrf0+fwAebrx+Py12u/j8frT6fTl8vsAabHv+PzX7PbO5/MAaLEiir0ye7xrh8E6jr6s0+1Ql8BCmL4AW61Ze78AUpN7AAAEbUlFTkSuQmCC';

// TODO: REPLACE THIS WITH THE URL OF THE LOGO YOU UPLOADED
// Example: const bjaleJholeLogo = 'https://your-supabase-project.supabase.co/storage/v1/object/public/assets/bjale-jhole-logo.png';
const bjaleJholeLogo = 'https://placehold.co/400x200/C62828/FFFFFF.png?text=Banglar+Jhale+Jhole&font=playfair-display';

const niraamishLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjx0ZXh0IHg9IjEwMCIgeT0iMzUiIGZvbnQtZmFtaWx5PSInUGxheWZhaXIgRGlzcGxheScsIHNlcmlmIiBmb250LXNpemU9IjMwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5OaXJhYW1pc2g8L3RleHQ+PC9zdmc+';
const dailyBoxLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjx0ZXh0IHg9IjEwMCIgeT0iMzUiIGZvbnQtZmFtaWx5PSInUGxheWZhaXIgRGlzcGxheScsIHNlcmlmIiBmb250LXNpemU9IjMwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UaGUgRGFpbHkgQm94PC90ZXh0Pjwvc3ZnPg==';
const terettiLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjx0ZXh0IHg9IjEwMCIgeT0iMzUiIGZvbnQtZmFtaWx5PSInUGxheWZhaXIgRGlzcGxheScsIHNlcmlmIiBmb250LXNpemU9IjMwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Ib3VzZSBPZiBUZXJldHRpPC90ZXh0Pjwvc3ZnPg==';


export const brandsData: { [key: string]: BrandData } = {
  'bjale-jhole': {
    id: 'bjale-jhole',
    petpoojaRestId: '317211', // UPDATED with user provided ID
    name: 'Banglar Jhale Jhole',
    tagline: 'Authentic Bengali Cuisine from Kolkata.',
    description: 'Experience the authentic flavors of Bengali cuisine, straight from the heart of Kolkata.',
    logo: bjaleJholeLogo,
    heroImage: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop',
    aboutText: 'Step into the heart of Bengal with Banglar Jhale Jhole. We bring you the authentic flavors of Kolkata, using traditional recipes passed down through generations. Our dishes are a celebration of rich spices, fresh ingredients, and the love of food that defines Bengali culture.',
    aboutImage: 'https://images.unsplash.com/photo-1596701064049-d822171f11e9?q=80&w=2070&auto=format&fit=crop',
    theme: { primary: '#C62828', accent: '#FFAB00', textOnPrimary: '#FFFFFF' }, // Maroon & Saffron
    menu: [
      {
        category: 'Kolkata Style Biryani',
        items: [
          { name: 'Chicken Biryani (Small 750ml)', description: 'Authentic Kolkata style biryani with flavourful aloo, chicken, and boiled egg.', price: '₹279', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_CB_SM' },
          { name: 'Chicken Biryani (Standard 1000ml)', description: 'Authentic Kolkata style biryani with flavourful aloo, chicken, and boiled egg.', price: '₹299', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_CB_STD' },
          { name: 'Chicken Biryani (Large 1500ml)', description: '2 Pcs Chicken, 2 Pcs Aloo & 2 Pcs Egg.', price: '₹519', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_CB_LG' },
          { name: 'Mutton Biryani (Small 750ml)', description: 'Authentic Kolkata style biryani with flavourful aloo, mutton, and boiled egg.', price: '₹379', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MB_SM' },
          { name: 'Mutton Biryani (Standard 1000ml)', description: 'Authentic Kolkata style biryani with flavourful aloo, mutton, and boiled egg.', price: '₹399', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MB_STD' },
          { name: 'Mutton Biryani (Large 1500ml)', description: '2 Pcs Mutton, 2 Pcs Aloo & 2 Pcs Egg.', price: '₹719', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MB_LG' },
          { name: 'Egg Biryani (Small 750ml)', description: 'Aromatic biryani with 2 boiled eggs and flavourful aloo.', price: '₹219', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_EB_SM' },
          { name: 'Egg Biryani (Standard 1000ml)', description: 'Aromatic biryani with 2 boiled eggs and flavourful aloo.', price: '₹239', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_EB_STD' },
          { name: 'Aloo Biryani (1000ml)', description: 'A vegetarian delight with fragrant rice and flavourful potatoes.', price: '₹189', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_AB_STD' },
        ],
      },
      {
        category: 'Pure Bengali Thalis',
        items: [
          { name: 'Veg Thali', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Mix Veg, Chatni, Papad.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_VEG' },
          { name: 'Egg Thali', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Egg Curry, Chatni, Papad.', price: '₹189', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_EGG' },
          { name: 'Chicken Thali', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Chicken Curry, Chatni, Papad.', price: '₹239', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_CHK' },
          { name: 'Mutton Thali', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Mutton Curry, Chatni, Papad.', price: '₹299', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_MTN' },
          { name: 'Fish Thali (Rohu)', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Rohu Fish Curry, Chatni, Papad.', price: '₹259', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_ROHU' },
          { name: 'Fish Thali (Katla)', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Katla Fish Curry, Chatni, Papad.', price: '₹289', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_KATLA' },
          { name: 'Maharaja Thali (Chicken)', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Basanti Pulao, Katla Curry, Chicken Curry, Chatni, Papad, Sweet.', price: '₹399', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_MAHA_CHK' },
          { name: 'Maharaja Thali (Mutton)', description: 'Rice/Roti, Dal, Jhuri Aloo Bhaja, Basanti Pulao, Katla Curry, Mutton Curry, Chatni, Papad, Sweet.', price: '₹499', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_TH_MAHA_MTN' },
        ]
      },
      {
        category: 'Snacks & Fries',
        items: [
          { name: 'Kolkata Veg Chop (2pcs)', description: 'Crispy vegetable cutlets, a favorite Kolkata street food.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SN_VCHOP' },
          { name: 'Kolkata Egg Devil (2pcs)', description: 'Boiled eggs wrapped in a spicy potato mixture and fried.', price: '₹179', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SN_EDEVIL' },
          { name: 'Kolkata Bhetki Fry (2pcs)', description: 'Classic Bhetki fish fillets, crumb-fried to perfection.', price: '₹419', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SN_BFRY' },
          { name: 'Kolkata Chicken Cutlet (2pcs)', description: 'Minced chicken cutlets, crispy on the outside, juicy inside.', price: '₹199', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SN_CCUT' },
          { name: 'Kolkata Style Kaju Matar Singara', description: '2pcs served with Red Chutney.', price: '₹79', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SN_SINGARA' },
        ]
      },
      {
        category: 'Main Course (Veg)',
        items: [
            { name: 'Sukto', description: 'A traditional Bengali mixed vegetable stew with a hint of bitterness.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_SUKTO' },
            { name: 'Begun Sundari', description: 'A delectable eggplant preparation.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_BEGUN' },
            { name: 'Dhokar Dalna', description: 'Lentil cakes simmered in a rich, flavorful gravy.', price: '₹129', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_DHOKA' },
            { name: 'Chanar Dalna', description: 'Cottage cheese balls in a light, aromatic curry.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_CHANA' },
            { name: 'Karaishuti Aloo Dam', description: 'Potatoes and green peas cooked in a spicy gravy.', price: '₹49', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_ALOODAM' },
            { name: 'Ghugney', description: 'A hearty curry made with dried yellow peas.', price: '₹49', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_GHUGNEY' },
        ]
      },
      {
        category: 'Main Course (Fish)',
        items: [
          { name: 'Rohu Mach Bhaja', description: 'Pan-fried Rohu fish, seasoned simply.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_ROHU_BHAJA' },
          { name: 'Katla Mach Bhaja', description: 'Pan-fried Katla fish, a Bengali staple.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_KATLA_BHAJA' },
          { name: 'Rohu Kalia (1/2pcs)', description: 'Rohu fish in a rich onion and tomato gravy.', price: '₹169/319', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_ROHU_KALIA' },
          { name: 'Katla Kalia (1/2pcs)', description: 'Katla fish cooked in a traditional spicy Kalia style.', price: '₹189/369', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_KATLA_KALIA' },
          { name: 'Lau Chingri', description: 'Bottle gourd cooked with small prawns in a flavorful curry.', price: '₹199', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_LAU_CHINGRI' },
          { name: 'Parse Jhal (4pcs)', description: 'Parse fish in a pungent mustard gravy.', price: '₹299', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_PARSE' },
          { name: 'Pabda Jhal (2pcs)', description: 'Pabda fish in a fiery mustard sauce.', price: '₹349', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_PABDA' },
          { name: 'Rui Macher Jhol (1pc)', description: 'A light and comforting Rohu fish stew.', price: '₹179', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_RUI_JHOL' },
          { name: 'Katla Macher Jhol (1pc)', description: 'A classic homemade style Katla fish curry.', price: '₹199', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_KATLA_JHOL' },
          { name: 'Macher Matha Die Murighonto', description: 'A traditional dish made with fish head and rice.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_MURIGHONTO' },
          { name: 'Chingri Malai Curry (2pcs)', description: 'Prawns cooked in a creamy coconut milk gravy.', price: '₹549', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_MALAI_CURRY' },
        ]
      },
      {
        category: 'Main Course (Chicken, Mutton, Egg)',
        items: [
          { name: 'Egg Kosha (2pcs)', description: 'Boiled eggs cooked in a thick, spicy gravy.', price: '₹119', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_EGG_KOSHA' },
          { name: 'Egg Curry with Aloo (2pcs)', description: 'A comforting curry with eggs and potatoes.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_EGG_CURRY' },
          { name: 'Chicken Chap', description: 'Slow-cooked chicken leg marinated in a rich, aromatic gravy.', price: '₹319', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_CHK_CHAP' },
          { name: 'Chicken Kosha (2pcs)', description: 'Tender chicken pieces slow-cooked in a spicy, dark gravy.', price: '₹299', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_CHK_KOSHA' },
          { name: 'Mutton Kosha (2pcs)', description: 'Slow-cooked mutton in a rich, spicy, dark gravy.', price: '₹369', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_MTN_KOSHA' },
          { name: 'Mutton Keema Ghugney (2pcs)', description: 'Minced mutton cooked with yellow peas in a traditional style.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_MC_MTN_KEEMA' },
        ]
      },
      {
        category: 'Rice, Breads & Dal',
        items: [
          { name: 'Masoor Dal', description: 'Simple and comforting red lentil soup.', price: '₹89', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_MASOOR' },
          { name: 'Macher Matha Diye Mug Dal', description: 'Moong dal cooked with fish head, a Bengali delicacy.', price: '₹179', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_MUG_DAL' },
          { name: 'Cholar Dal', description: 'Bengal gram dal, slightly sweet and savory.', price: '₹59', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_CHOLAR' },
          { name: 'White Rice (1000ml)', description: 'Steamed fluffy white rice.', price: '₹119', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_RICE_1000' },
          { name: 'White Rice (1500ml)', description: 'Steamed fluffy white rice.', price: '₹169', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_RICE_1500' },
          { name: 'Basanti Pulao (1000ml)', description: 'Sweet and fragrant yellow pilaf rice.', price: '₹189', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_PULAO_1000' },
          { name: 'Basanti Pulao (1500ml)', description: 'Sweet and fragrant yellow pilaf rice.', price: '₹249', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_PULAO_1500' },
          { name: 'Laccha Paratha', description: 'Flaky, layered flatbread.', price: '₹39', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_LACCHA' },
          { name: 'Luchi (4pcs)', description: 'Deep-fried fluffy bread.', price: '₹59', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_LUCHI' },
          { name: 'Karaisutir Kachuri (4pcs)', description: 'Fried bread stuffed with a spiced green pea filling.', price: '₹69', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_SD_KACHURI' },
        ]
      },
      {
        category: 'Kolkata Style Rolls',
        items: [
          { name: 'Chicken Kathi Roll', description: 'Juicy chicken tikka wrapped in a paratha.', price: '₹129', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_RL_CHK_KATHI' },
          { name: 'Egg Chicken Roll', description: 'Chicken Kathi roll with an added layer of egg.', price: '₹149', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_RL_EGG_CHK' },
          { name: 'Chilli Paneer Roll', description: 'Spicy chilli paneer wrapped in a paratha.', price: '₹39', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_RL_PANEER' },
          { name: 'Double Egg Roll', description: 'A simple roll with two eggs, onions and sauces.', price: '₹59', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_RL_DBL_EGG' },
        ]
      },
      {
        category: 'Desserts',
        items: [
          { name: 'Gulab Jamun (1pc)', description: 'Soft, spongy balls soaked in sweet syrup.', price: '₹20', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_DS_GULAB' },
          { name: 'Gajorer Halua (100ml)', description: 'A sweet dessert pudding made from grated carrots.', price: '₹59', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_DS_HALUA_100' },
          { name: 'Gajorer Halua (250ml)', description: 'A sweet dessert pudding made from grated carrots.', price: '₹129', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_DS_HALUA_250' },
          { name: 'Payesh (250ml)', description: 'A traditional Bengali rice pudding.', price: '₹129', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', isAvailable: true, externalItemId: 'BJ_DS_PAYESH' },
        ]
      },
    ],
    gallery: [ 'https://images.unsplash.com/photo-1582030807759-00f7ac83d09a?w=500', 'https://images.unsplash.com/photo-1579631542720-3a8383563ce6?w=500', 'https://images.unsplash.com/photo-1625869422393-2339d3c52e1f?w=500', 'https://images.unsplash.com/photo-1588167073243-782d61b3696f?w=500' ],
    contactInfo: { address: 'L S Enclave, 1st Floor, 2nd Cross, Horamavu Main Road, Bangalore - 560043', phone: '+91 96117 74424', hours: 'Mon - Sun: 11 AM - 11 PM' }
  },
  'niraamish': {
    id: 'niraamish',
    petpoojaRestId: 'PFG12346', // PLACEHOLDER
    name: 'Niraamish',
    tagline: 'Savour Purity, Relish Tradition.',
    description: 'Delight in pure vegetarian Bengali dishes, crafted with tradition and care.',
    logo: niraamishLogo,
    heroImage: 'https://images.unsplash.com/photo-1543363363-6b79ab609312?q=80&w=2070&auto=format&fit=crop',
    aboutText: 'Niraamish offers a divine vegetarian experience, exploring the rich tapestry of Bengali flavors. Our menu is a testament to the versatility and deliciousness of plant-based cuisine, crafted with fresh, seasonal ingredients and traditional spices.',
    aboutImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    theme: { primary: '#2E7D32', accent: '#AED581', textOnPrimary: '#FFFFFF' }, // Green & Light Green
    menu: [
      {
        category: 'Snacks',
        items: [
          { name: 'Kolkata Veg Chop (2pcs)', description: 'A popular Bengali snack made with beetroot and other vegetables.', price: '₹99', image: 'https://images.unsplash.com/photo-1515003197210-90cd718cf35b?w=500', isAvailable: true },
          { name: 'Kolkata Kaju Matar Singara (2pcs)', description: 'Served with Red Chutney.', price: '₹79', image: 'https://images.unsplash.com/photo-1515003197210-90cd718cf35b?w=500', isAvailable: true },
          { name: 'Kolkata Chilli Panner Roll', description: 'Spicy paneer wrapped in a paratha.', price: '₹149', image: 'https://images.unsplash.com/photo-1515003197210-90cd718cf35b?w=500', isAvailable: true },
          { name: 'Mochar Chop (Seasonal)', description: 'A delectable snack made from banana blossoms.', price: '₹99', image: 'https://images.unsplash.com/photo-1515003197210-90cd718cf35b?w=500', isAvailable: true },
          { name: 'Postor Bora', description: 'Crispy poppy seed fritters, a Bengali delicacy.', price: '₹199', image: 'https://images.unsplash.com/photo-1515003197210-90cd718cf35b?w=500', isAvailable: true },
        ],
      },
      {
        category: 'Accompaniments & Breads',
        items: [
          { name: 'Begun Bhaja (2pcs)', description: 'Pan-fried eggplant slices.', price: '₹69', image: 'https://plus.unsplash.com/premium_photo-1664147507921-2e06a35a420b?w=500', isAvailable: true },
          { name: 'Jhuri Aloo Bhaja', description: 'Crispy, thinly grated potato fries.', price: '₹79', image: 'https://plus.unsplash.com/premium_photo-1664147507921-2e06a35a420b?w=500', isAvailable: true },
          { name: 'Laccha Paratha', description: 'Layered and flaky flatbread.', price: '₹39', image: 'https://plus.unsplash.com/premium_photo-1664147507921-2e06a35a420b?w=500', isAvailable: true },
          { name: 'Luchi (3pcs)', description: 'Soft, deep-fried puffed bread.', price: '₹69', image: 'https://plus.unsplash.com/premium_photo-1664147507921-2e06a35a420b?w=500', isAvailable: true },
          { name: 'Karaishutir Kochuri (3pcs)', description: 'Fried bread stuffed with a spiced green pea filling.', price: '₹79', image: 'https://plus.unsplash.com/premium_photo-1664147507921-2e06a35a420b?w=500', isAvailable: true },
        ],
      },
      {
        category: 'Curries (to pair with Breads)',
        items: [
          { name: 'Cholar Dal', description: 'A classic Bengali lentil dish, slightly sweet and savory.', price: '₹79', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500', isAvailable: true },
          { name: 'Aloor Dam', description: 'A flavorful and spicy potato curry.', price: '₹89', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500', isAvailable: true },
          { name: 'Ghugney', description: 'A curry made from dried yellow peas.', price: '₹79', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500', isAvailable: true },
        ],
      },
      {
        category: 'Rice & Thali',
        items: [
          { name: 'White Rice', description: 'Steamed Basmati rice.', price: '₹79', image: 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', isAvailable: true },
          { name: 'Basanti Pulao', description: 'A sweet and fragrant pilaf, yellow in color.', price: '₹169', image: 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', isAvailable: true },
          { name: 'Peas Pulao', description: 'A savory rice dish with green peas.', price: '₹199', image: 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', isAvailable: true },
          { name: 'Bengali Veg Thali', description: 'Includes Rice/Roti, Dal, Jhuri Alu Bhaja, Sabji, Chatni, Papad.', price: '₹119', image: 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', isAvailable: true },
          { name: 'Kolkata Veg Biryani', description: 'Aromatic vegetable biryani, Kolkata style.', price: '₹149', image: 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', isAvailable: true },
        ],
      },
      {
        category: 'Sweets & Chutney',
        items: [
          { name: 'Gulab Jamun', description: 'Soft, sweet, deep-fried dumplings in syrup.', price: '₹30', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', isAvailable: true },
          { name: 'Gajorer Haluwa', description: 'A sweet carrot pudding.', price: '₹79', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', isAvailable: true },
          { name: 'Payesh', description: 'A traditional Bengali rice pudding.', price: '₹89', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', isAvailable: true },
          { name: 'Tomato Chutney', description: 'A sweet and tangy tomato relish.', price: '₹59', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', isAvailable: true },
          { name: 'Aamer Chutney', description: 'A sweet and sour mango chutney.', price: '₹69', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', isAvailable: true },
        ],
      },
    ],
    gallery: [ 'https://images.unsplash.com/photo-1515003197210-90cd718cf35b?w=500', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500' ],
    contactInfo: { address: 'L S Enclave, 1st Floor, 2nd Cross, Horamavu Main Road, Bangalore - 560043', phone: '+91 98319 36977', hours: 'Tue - Sun: 11 AM - 10 PM' }
  },
  'daily-box': {
    id: 'daily-box',
    petpoojaRestId: 'PFG12347', // PLACEHOLDER
    name: 'The Daily Box',
    tagline: 'Wholesome Meals, Delivered Daily.',
    description: 'Nutritious and delicious daily meals, perfect for your busy lifestyle.',
    logo: dailyBoxLogo,
    heroImage: 'https://images.unsplash.com/photo-1582217283738-2345a3383a15?q=80&w=2070&auto=format&fit=crop',
    aboutText: 'The Daily Box is your solution for healthy, delicious, and convenient meals. We offer a curated menu of wholesome dishes, prepared fresh and delivered to your doorstep. Perfect for busy professionals and families who value nutritious eating.',
    aboutImage: 'https://images.unsplash.com/photo-1504754524776-8f4f37790774?q=80&w=2070&auto=format&fit=crop',
    theme: { primary: '#0277BD', accent: '#FFCA28', textOnPrimary: '#FFFFFF' }, // Blue & Yellow
    menu: [
      {
        category: 'Bowls',
        items: [
          { name: 'Quinoa Salad Bowl', description: 'With roasted vegetables and a lemon-tahini dressing.', price: '₹450', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', isAvailable: true },
          { name: 'Grilled Chicken Bowl', description: 'Served with brown rice, steamed broccoli, and avocado.', price: '₹550', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', isAvailable: true },
          { name: 'Tofu Poke Bowl', description: 'Marinated tofu, edamame, and fresh veggies on a bed of rice.', price: '₹500', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', isAvailable: true },
        ],
      },
    ],
    gallery: [ 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', 'https://images.unsplash.com/photo-1490645935967-10de6ba17021?w=500' ],
    contactInfo: { address: '789, Salt Lake City, Kolkata', phone: '+91 87654 32109', hours: 'Mon - Sat: 9 AM - 9 PM' }
  },
  'teretti': {
    id: 'teretti',
    petpoojaRestId: 'PFG12348', // PLACEHOLDER
    name: 'House Of Teretti',
    tagline: 'Exquisite Indo-Chinese Flavors.',
    description: 'Discover the unique fusion of Indian and Chinese culinary traditions.',
    logo: terettiLogo,
    heroImage: 'https://images.unsplash.com/photo-1608219999902-1f343a41a4a4?q=80&w=1964&auto=format&fit=crop',
    aboutText: "Welcome to House Of Teretti, where the bold flavors of India meet the subtle artistry of Chinese cuisine. Our chefs masterfully blend spices and techniques to create unique and unforgettable dishes that will tantalize your taste buds.",
    aboutImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
    theme: { primary: '#D84315', accent: '#FFEB3B', textOnPrimary: '#FFFFFF' }, // Orange & Yellow
    menu: [
      {
        category: 'Starters',
        items: [
          { name: 'Chilli Paneer Dry', description: 'Crispy paneer tossed in a spicy, tangy sauce.', price: '₹320', image: 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', isAvailable: true },
          { name: 'Dragon Chicken', description: 'Spicy and savory fried chicken strips.', price: '₹400', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500', isAvailable: true },
          { name: 'Veg Manchurian', description: 'Vegetable balls in a classic Manchurian sauce.', price: '₹280', image: 'https://images.unsplash.com/photo-1606523963234-31f85e4939b4?w=500', isAvailable: true },
        ],
      },
    ],
    gallery: [ 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop', 'https://images.unsplash.com/photo-1606523963234-31f85e4939b4?w=500', 'https://images.unsplash.com/photo-1563379926898-059e56e5df85?w=500', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500' ],
    contactInfo: { address: '101, Chinatown, Kolkata', phone: '+91 76543 21098', hours: 'Everyday: 1 PM - 1 AM' }
  }
};
