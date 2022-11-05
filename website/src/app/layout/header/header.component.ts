import { Component, OnInit } from '@angular/core';
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { IdToken, UserService } from "../../common";
import { Observable } from "rxjs";

@Component({
  selector: 'mcma-header',
  templateUrl: './header.component.html',
  styleUrls: [ './header.component.scss' ]
})
export class HeaderComponent implements OnInit {
  faGithub = faGithub;

  idToken$: Observable<IdToken | null>;

  constructor(private userService: UserService) {
    this.idToken$ = this.userService.idToken$;
  }

  ngOnInit(): void {
  }

}
