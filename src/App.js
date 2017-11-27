import React, { Component } from 'react';
import axios from 'axios';
import store from 'store';
import TwitterLogin from 'react-twitter-auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css'
import 'font-awesome/css/font-awesome.css'

const baseUrl = process.env.REACT_APP_API_URL;
const login_url = baseUrl + "api/v1/auth/twitter";
const request_token_url = baseUrl + "api/v1/auth/twitter/reverse";
class App extends Component {
  constructor(){
    super();
    let loggedIn = store.get("loggedIn") ? true: false;
    this.state = {
      data: '',
      keyword: '',
      loading: true,
      isSearching: false, 
      isLoggedIn: loggedIn
    };

    this.searchRestaurants = this.searchRestaurants.bind(this);
    this.changeHandler = this.changeHandler.bind(this);
    this.addToGoingList = this.addToGoingList.bind(this);
    this.parseJwt = this.parseJwt.bind(this);
    this.logout = this.logout.bind(this);
  }

  componentWillMount() {
    if(store.get('loggedIn')) {
      let key = store.get('keyword');
      this.setState({ keyword: key });
    }
  }

  componentDidMount() {
    if(store.get('loggedIn')) {
      console.log(this.state.keyword, 'search keyword');
      this.searchRestaurants();
    }
  }

  searchRestaurants() {
    if(!this.state.keyword) {
      return false;
    }
    if (store.get('loggedIn')){
      store.set('keyword', this.state.keyword)
    }
    let _this = this;
    this.setState({ isSearching: true, loading: true });
      axios({
        method: 'get',
        url: baseUrl + 'search-bar?keyword=' + this.state.keyword
      }).then(function (res) {
        console.log(res, "restaurants");
        _this.setState({ data: res.data, loading: false, isSearching: false });
      }).catch(err => {
        console.log(err.response);
      });
  }
  changeHandler(e) {
    this.setState({keyword: e.target.value});
  }
  addToGoingList(bar, index) {
    let data = {
      "id": bar.id,
      "numberOfGoers": bar.numberOfGoers
    }
    let obj = this.state.data.businesses[index];
    let _this = this;
    let id = store.get('loggedIn');
    axios({
      method: 'post',
      headers: { 'token': id },
      url: baseUrl + 'add-going-list',
      data: data
    }).then(function (res) {
      console.log('success ', res);
      obj.numberOfGoers = res.data.numberOfGoers;
      _this.setState({ obj });
      toast.success(res.data.message)
    }).catch(err => {
      console.log(err.data);
      toast.info('You need to signin to add going list.')
    })
  }

  onSuccess = (response) => {
    const token = response.headers.get('x-auth-token');
    response.json()
    .then(user => {
      if (token) {
        store.set('loggedIn', token);
        store.set('user', user.dispalyname);
        this.setState({ isLoggedIn: true });
        toast.success('Login success');
      }
    })
    .catch(err => {
      toast.error('Login failed');
    });
  };

  onFailed = (error) => {
    alert(error);
  };

  parseJwt(token) {
      let base64Url = token.split('.')[1];
      let base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(Buffer.from(base64, 'base64').toString());
  };

  logout() {
    store.remove('user');
    store.remove('loggedIn');
    store.remove('keyword');
    this.setState({ isLoggedIn: false });
  }

  render() {
    let content;
    if (!this.state.loading) {
      if (this.state.data.businesses.length) {
        content = this.state.data.businesses.map((bar, index) =>
          <li className="bar col-md-12" key={index}>
            <div className="col-md-2">
              <img src={bar.image_url} className="bar-img"/>
            </div>
            <div className="col-md-10 bar-info">
              <p className="bar-head">
                <a className="bar-name">{bar.name}</a>
                <span className="number-goers" onClick={() => this.addToGoingList(bar, index)}>{bar.numberOfGoers} GOING</span>
              </p>
              <p className="snippet"><i>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam et fermentum dui. Ut orci quam, ornare sed lorem sed, hendrerit auctor dolor. Nulla viverra, nibh quis ultrices malesuada, ligula ipsum vulputate diam, aliquam egestas nibh ante vel dui. Sed in tellus interdum eros vulputate placerat sed non enim. Pellentesque eget justo porttitor urna dictum fermentum sit amet sed mauris. Praesent molestie vestibulum erat ac rhoncus. Aenean nunc risus, accumsan nec ipsum et, convallis sollicitudin dui. Proin dictum quam a semper malesuada. Etiam porta sit amet risus quis porta. Nulla facilisi. Cras at interdum ante. Ut gravida pharetra ligula vitae malesuada.  
              </i></p>
            </div>
          </li>
        );
      } else {
        content = <p>There is no bars for this keywords.</p>
      }
    }
    return (
      <div className="App container">
        <header className="App-header">
          <h1 className="App-title">Plans Tonight ?</h1>
          <h1>
            <i className="fa fa-map-marker"></i>
            <i className="fa fa-cab"></i>
            <i className="fa fa-glass"></i>
          </h1>
          <p className="App-intro">See which bars are hoppin ' tonight and RSVP ahead of time!</p>
          <p className="auth-btn">
            {!this.state.isLoggedIn &&
              <TwitterLogin loginUrl={login_url}
                onFailure={this.onFailed} onSuccess={this.onSuccess}
                requestTokenUrl={request_token_url} />
            }
            {this.state.isLoggedIn &&
              <button className="search-btn" onClick={this.logout}>Logout</button>
            }
          </p>
        </header>
        <main className="main-section">
          <div className="row">
            <div className="col-md-10">
              <div className="col-md-10 col-sm-10 col-xs-12">
                <input type="text" value={this.state.keyword} onChange={this.changeHandler} className="form-control search-input" placeholder="WHERE YOU AT?" autoFocus/>
              </div>
              <div className="col-md-2 col-sm-2 col-xs-12">
                <button className="search-btn" onClick={this.searchRestaurants}>Search</button>
              </div>
            </div>
          </div>
          <div className="row">
            <ul className="col-md-12 bar-list">
              {content}
              { this.state.isSearching && 
                <i className="fa fa-cog fa-spin fa-4x fa-fw"></i>
              }
            </ul>
          </div>
        </main>
        <footer>
          <span>&copy; {new Date().getFullYear()} | </span>
          <span>FCC - Night Life App | </span>
          <a href="https://github.com/kyawzintun/night-life">Github | </a>
          <a href="https://yasser-nightlife-app.herokuapp.com/">Original Design</a>
        </footer>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          />      
      </div>
    );
  }
}

export default App;
