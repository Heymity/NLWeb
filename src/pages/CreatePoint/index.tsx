import './CreatePoint.css';

import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { Link, useHistory } from 'react-router-dom';

import logo from '../../assets/logo.svg';
import Dropzone from '../../Components/DropZone';
import api from '../../service/api';

//Arrat ou obj: manualmente informar o tipo

interface Item {
  id: number,
  name: string,
  image_url: string,
}
interface IBGEUFRsponse{
  sigla: string
}
interface IBGECityRsponse{
  nome: string
}

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);

  const [selectedUF, setSelectedUF] = useState('0');

  const [cityNames, setCityNames] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('0');

  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
  const [initialPosition, setInitialPositionPosition] = useState<[number, number]>([0,0]);

  const [selectedFile, setSelectedFile] = useState<File>();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  })

  const history = useHistory();

  const [selectedItem, setSelectedItem] = useState<number[]>([])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords

      setInitialPositionPosition([latitude, longitude])
    })
  }, [])

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    })
  }, [])

  useEffect(() => {
    axios.get<IBGEUFRsponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
      const ufInitials = response.data.map(uf => uf.sigla)
      
      setUfs(ufInitials);
    })
  }, [])

  useEffect(() => {
    if(selectedUF === '0') {
      return;
    }

    axios
    .get<IBGECityRsponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`)
    .then(response => {
      const cityNames = response.data.map(city => city.nome)
      
      setCityNames(cityNames);
    })

  }, [selectedUF])

  function HandleUFSelect(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUF(event.target.value);
  }

  function HandleCitySelect(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value);
  }

  function HandleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng
    ])
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormData({ ...formData, [name]: value})
  }

  function handleSelectItem(id: number) {
    const isSelected = selectedItem.findIndex(item => item === id)

    if(isSelected >= 0) {
      const filter = selectedItem.filter(item => item !== id)

      setSelectedItem(filter);
    } else {
      setSelectedItem([...selectedItem, id]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUF;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItem;

    const data = new FormData();


      data.append('name', name);
      data.append('email', email);
      data.append('whatsapp', whatsapp);
      data.append('uf', uf);
      data.append('city', city);
      data.append('latitude', String(latitude));
      data.append('longitude', String(longitude));
      data.append('items', items.join(','));
      
      if(selectedFile) {
        data.append('image', selectedFile)
      }


    await api.post('points', data);

    alert("Ponto criado")
    history.push('/');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>

        <Link to='/'>
          <FiArrowLeft/>
          Voltar para Home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br/> ponto de coleta</h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              onChange={handleInputChange}
              type="text"
              name="name"
              id="name"
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                onChange={handleInputChange}
                type="email"
                name="email"
                id="email"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Whatsapp</label>
              <input
                onChange={handleInputChange}
                type="text"
                name="whatsapp"
                id="whatsapp"
              />
            </div>
          </div>
        </fieldset>
          
        <fieldset>
          <legend>
            <h2>Endereco</h2>
            <span>Slecione o endereco no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={HandleMapClick}>
            <TileLayer 
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition}/>
          </Map>
          
          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado(UF)</label>
              <select name="uf" value={selectedUF} onChange={HandleUFSelect}>
                <option value="0">Slecione uma UF</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select name="city" value={selectedCity} onChange={HandleCitySelect}>
                <option value="0">Slecione uma Cidade</option>
                {cityNames.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
        


        <fieldset>
          <legend>
            <h2>Items de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {
              items.map(item => (
              <li 
                key={item.id} 
                onClick={() => handleSelectItem(item.id)}
                className={selectedItem.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url}/>
                <span>{item.name}</span>
              </li>    
              ))
            }       
          </ul>

          <button type="submit">
            Cadastrar ponto de coleta
          </button>
        </fieldset>
      </form>
    </div>
  )
}

export default CreatePoint;
